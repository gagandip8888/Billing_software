import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const rawQuery = (
      searchParams.get("query") ||
      searchParams.get("productId") ||
      searchParams.get("invoiceNo") ||
      searchParams.get("q") ||
      ""
    ).trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: "Search query is required (Invoice No, Customer Name/Mobile, or Product)" },
        { status: 400 }
      );
    }

    // Flexible multi-field search across invoices, customers, and line items
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        status: { not: "CANCELLED" },
        OR: [
          { invoiceNo: { contains: rawQuery, mode: "insensitive" } },
          {
            customer: {
              OR: [
                { name: { contains: rawQuery, mode: "insensitive" } },
                { mobile: { contains: rawQuery, mode: "insensitive" } },
              ],
            },
          },
          {
            items: {
              some: {
                OR: [
                  { name: { contains: rawQuery, mode: "insensitive" } },
                  { productId: { contains: rawQuery, mode: "insensitive" } },
                  {
                    product: {
                      OR: [
                        { name: { contains: rawQuery, mode: "insensitive" } },
                        { productId: { contains: rawQuery, mode: "insensitive" } },
                        { barcode: { contains: rawQuery, mode: "insensitive" } },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            address: true,
            creditBalance: true,
            totalSpent: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productId: true,
                name: true,
                price: true,
                stockQty: true,
                barcode: true,
              },
            },
          },
        },
        salesReturns: {
          include: {
            items: true,
          },
          orderBy: { returnDate: "desc" },
        },
      },
      orderBy: { invoiceDate: "desc" },
      take: 20,
    });

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: `No active invoices found matching "${rawQuery}"` },
        { status: 404 }
      );
    }

    // Transform invoices with calculated already-returned quantities and unit pricing
    const formattedInvoices = invoices.map((inv) => {
      const walkInName = (inv.metadata as any)?.walkInCustomerName;
      const walkInMobile = (inv.metadata as any)?.walkInCustomerMobile;

      const customerObj = inv.customer
        ? {
            id: inv.customer.id,
            name: inv.customer.name,
            mobile: inv.customer.mobile,
            address: inv.customer.address || "",
            creditBalance: Number(inv.customer.creditBalance || 0),
            totalSpent: Number(inv.customer.totalSpent || 0),
          }
        : walkInName
        ? {
            id: "",
            name: walkInName,
            mobile: walkInMobile || "",
            address: "",
            creditBalance: 0,
            totalSpent: 0,
          }
        : {
            id: "",
            name: "Walk-in Customer",
            mobile: "",
            address: "",
            creditBalance: 0,
            totalSpent: 0,
          };

      // Map past return quantities per product/item name
      const alreadyReturnedMap: Record<string, number> = {};
      inv.salesReturns.forEach((sr) => {
        sr.items.forEach((item) => {
          const key = item.name.trim().toLowerCase();
          alreadyReturnedMap[key] = (alreadyReturnedMap[key] || 0) + Number(item.qty);
        });
      });

      const items = inv.items.map((item) => {
        const soldQty = Number(item.qty) || 1;
        const alreadyReturnedQty = alreadyReturnedMap[item.name.trim().toLowerCase()] || 0;
        const availableReturnQty = Math.max(0, soldQty - alreadyReturnedQty);

        const lineNetBase = Math.max(0, Number(item.price) * soldQty - (Number(item.itemDiscount) || 0));
        const unitBasePrice = Math.round((lineNetBase / soldQty) * 100) / 100;
        const taxRate = Number(item.taxRate) || 0;

        let unitTax = 0;
        if (Number(item.taxAmount) > 0) {
          unitTax = Number(item.taxAmount) / soldQty;
        } else if (taxRate > 0) {
          unitTax = unitBasePrice * (taxRate / 100);
        }
        unitTax = Math.round(unitTax * 100) / 100;

        const unitTotal = Math.round((unitBasePrice + unitTax) * 100) / 100;

        return {
          id: item.id,
          productId: item.productId || item.product?.productId || item.id,
          name: item.name || item.product?.name || "Product Item",
          soldQty,
          alreadyReturnedQty,
          availableReturnQty,
          unitBasePrice,
          taxRate,
          unitTax,
          unitTotal,
          total: Number(item.total),
          currentStock:
            item.product?.stockQty !== null && item.product?.stockQty !== undefined
              ? Number(item.product.stockQty)
              : null,
        };
      });

      const totalReturnedAmount = inv.salesReturns.reduce(
        (sum, sr) => sum + Number(sr.totalAmount),
        0
      );

      const isFullyReturned = items.every((i) => i.availableReturnQty === 0);

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.invoiceDate.toISOString(),
        paymentMode: inv.paymentMode,
        status: inv.status,
        subtotal: Number(inv.subtotal),
        taxAmount: Number(inv.taxAmount),
        discountAmount: Number(inv.discountAmount),
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        customer: customerObj,
        items,
        previousReturns: inv.salesReturns.map((sr) => ({
          id: sr.id,
          returnNo: sr.returnNo,
          returnDate: sr.returnDate.toISOString(),
          totalAmount: Number(sr.totalAmount),
          refundMode: sr.refundMode,
          reason: sr.reason,
          itemsCount: sr.items.length,
        })),
        totalReturnedAmount,
        isFullyReturned,
      };
    });

    // Flatten candidate items for backward compatibility
    const flatCandidates = formattedInvoices.flatMap((inv) =>
      inv.items.map((it) => ({
        invoiceItemId: it.id,
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        customer: inv.customer,
        qty: it.availableReturnQty,
        soldQty: it.soldQty,
        alreadyReturnedQty: it.alreadyReturnedQty,
        price: it.unitTotal,
        unitBasePrice: it.unitBasePrice,
        taxRate: it.taxRate,
        unitTax: it.unitTax,
        total: it.total,
        productId: it.productId,
        productName: it.name,
        currentStock: it.currentStock,
        paymentMode: inv.paymentMode,
        balanceAmount: inv.balanceAmount,
      }))
    );

    const firstItem = flatCandidates[0];
    const productSummary = firstItem
      ? {
          id: firstItem.productId,
          productId: firstItem.productId,
          name: firstItem.productName,
          price: firstItem.price,
          stockQty: firstItem.currentStock,
        }
      : null;

    const tenantDetails = {
      businessName: tenant.businessName,
      ownerName: tenant.ownerName,
      mobile: tenant.mobile,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      pincode: tenant.pincode,
      gstNo: tenant.gstNo,
    };

    return NextResponse.json({
      invoices: formattedInvoices, // Full rich bill objects
      candidateItems: flatCandidates, // Flattened line items
      product: productSummary,
      tenant: tenantDetails,
    });
  } catch (error: any) {
    console.error("GET /api/returns/by-product error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to search returnable bills" },
      { status: 500 }
    );
  }
}

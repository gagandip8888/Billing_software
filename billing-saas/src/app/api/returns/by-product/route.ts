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
      searchParams.get("q") ||
      ""
    ).trim();

    if (!rawQuery) {
      return NextResponse.json(
        { error: "Search query is required (Product ID, Name, Customer Name, or Bill No)" },
        { status: 400 }
      );
    }

    // Flexible multi-field search:
    // Matches by Product ID, Item Name, Barcode, Invoice No, or Customer Name / Mobile
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          tenantId: tenant.id,
          status: { not: "CANCELLED" },
        },
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
          {
            invoice: {
              invoiceNo: { contains: rawQuery, mode: "insensitive" },
            },
          },
          {
            invoice: {
              customer: {
                OR: [
                  { name: { contains: rawQuery, mode: "insensitive" } },
                  { mobile: { contains: rawQuery, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      include: {
        product: {
          select: {
            id: true,
            productId: true,
            name: true,
            price: true,
            stockQty: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
            status: true,
            metadata: true,
            customer: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: {
        invoice: { invoiceDate: "desc" },
      },
      take: 50,
    });

    if (invoiceItems.length === 0) {
      return NextResponse.json(
        { error: `No sales invoices found matching "${rawQuery}"` },
        { status: 404 }
      );
    }

    const candidateInvoices = invoiceItems.map((item) => {
      const walkInName = (item.invoice.metadata as any)?.walkInCustomerName;
      const walkInMobile = (item.invoice.metadata as any)?.walkInCustomerMobile;

      const customerObj = item.invoice.customer
        ? {
            id: item.invoice.customer.id,
            name: item.invoice.customer.name,
            mobile: item.invoice.customer.mobile,
          }
        : walkInName
        ? {
            id: undefined,
            name: walkInName,
            mobile: walkInMobile || "",
          }
        : {
            id: undefined,
            name: "Walk-in Customer",
            mobile: "",
          };

      return {
        invoiceItemId: item.id,
        invoiceId: item.invoice.id,
        invoiceNo: item.invoice.invoiceNo,
        date: item.invoice.invoiceDate.toISOString(),
        customer: customerObj,
        qty: Number(item.qty),
        price: Number(item.price),
        total: Number(item.total),
        productId: item.productId || item.product?.productId || item.id,
        productName: item.name || item.product?.name || "Product Item",
        currentStock: item.product?.stockQty !== null && item.product?.stockQty !== undefined
          ? Number(item.product.stockQty)
          : null,
      };
    });

    // Extract first product summary if direct product match exists
    const firstMatch = invoiceItems[0];
    const productSummary = {
      id: firstMatch.product?.id || firstMatch.id,
      productId: firstMatch.product?.productId || firstMatch.productId || "PROD",
      name: firstMatch.name || firstMatch.product?.name || rawQuery,
      price: Number(firstMatch.price),
      stockQty: firstMatch.product?.stockQty !== null && firstMatch.product?.stockQty !== undefined
        ? Number(firstMatch.product.stockQty)
        : null,
    };

    return NextResponse.json({
      product: productSummary,
      invoices: candidateInvoices,
    });
  } catch (error: any) {
    console.error("GET /api/returns/by-product error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to search returnable items" },
      { status: 500 }
    );
  }
}

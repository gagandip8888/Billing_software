import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { InvoiceStatus, PaymentMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const returns = await prisma.salesReturn.findMany({
      where: { tenantId: tenant.id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
            paymentMode: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            metadata: true,
            customer: {
              select: {
                id: true,
                name: true,
                mobile: true,
                creditBalance: true,
                address: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { returnDate: "desc" },
    });

    const serialized = returns.map((r) => {
      const walkInName = (r.invoice.metadata as any)?.walkInCustomerName;
      const walkInMobile = (r.invoice.metadata as any)?.walkInCustomerMobile;
      const customerData = r.invoice.customer
        ? {
            id: r.invoice.customer.id,
            name: r.invoice.customer.name,
            mobile: r.invoice.customer.mobile,
            creditBalance: Number(r.invoice.customer.creditBalance || 0),
            address: r.invoice.customer.address || "",
          }
        : walkInName
        ? { id: "", name: walkInName, mobile: walkInMobile || "", creditBalance: 0, address: "" }
        : null;

      return {
        id: r.id,
        returnNo: r.returnNo,
        returnDate: r.returnDate.toISOString(),
        totalAmount: Number(r.totalAmount),
        refundMode: r.refundMode,
        reason: r.reason,
        productId: r.productId,
        productName: r.productName,
        creditNoteId: r.creditNoteId,
        invoice: {
          id: r.invoice.id,
          invoiceNo: r.invoice.invoiceNo,
          invoiceDate: r.invoice.invoiceDate.toISOString(),
          paymentMode: r.invoice.paymentMode,
          totalAmount: Number(r.invoice.totalAmount),
          paidAmount: Number(r.invoice.paidAmount),
          balanceAmount: Number(r.invoice.balanceAmount),
          status: r.invoice.status,
          customer: customerData,
        },
        items: r.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          qty: Number(i.qty),
          price: Number(i.price),
          total: Number(i.total),
        })),
      };
    });

    // Provide tenant details for clean branding on receipts
    const tenantDetails = {
      businessName: tenant.businessName,
      ownerName: tenant.ownerName,
      mobile: tenant.mobile,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      pincode: tenant.pincode,
      gstNo: tenant.gstNo,
      upiId: tenant.settings?.upiId || null,
      whatsappNumber: tenant.settings?.whatsappNumber || tenant.mobile,
    };

    return NextResponse.json({ returns: serialized, tenant: tenantDetails });
  } catch (error: any) {
    console.error("GET /api/returns error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch sales returns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { invoiceId, itemsToReturn, refundMode = "CREDIT_NOTE", reason } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    if (!itemsToReturn || !Array.isArray(itemsToReturn) || itemsToReturn.length === 0) {
      return NextResponse.json(
        { error: "At least one item must be selected for return" },
        { status: 400 }
      );
    }

    // Verify invoice exists and belongs to tenant, including items, customer, and prior returns
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: tenant.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        salesReturns: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate already returned quantities per invoice item
    const alreadyReturnedMap: Record<string, number> = {};
    for (const pastRet of invoice.salesReturns) {
      for (const pastItem of pastRet.items) {
        const key = pastItem.name.trim().toLowerCase();
        alreadyReturnedMap[key] = (alreadyReturnedMap[key] || 0) + Number(pastItem.qty);
      }
    }

    // Validate return items and compute GST-inclusive return amounts
    let totalBaseAmount = 0;
    let totalTaxAmount = 0;
    let totalReturnAmount = 0;

    const validatedItems: Array<{
      origItemId: string;
      productId: string | null;
      name: string;
      qty: number;
      unitBasePrice: number;
      baseAmount: number;
      taxRate: number;
      taxAmount: number;
      total: number;
    }> = [];

    for (const item of itemsToReturn) {
      const returnQty = Number(item.qty);
      if (!returnQty || returnQty <= 0) continue;

      // Find original invoice item by ID or name
      const origItem = invoice.items.find(
        (i) => i.id === item.id || i.id === item.invoiceItemId || i.name.trim().toLowerCase() === item.name?.trim().toLowerCase()
      );

      if (!origItem) {
        return NextResponse.json(
          { error: `Item "${item.name}" not found on original invoice #${invoice.invoiceNo}` },
          { status: 400 }
        );
      }

      const soldQty = Number(origItem.qty) || 1;
      const priorReturned = alreadyReturnedMap[origItem.name.trim().toLowerCase()] || 0;
      const availableReturnQty = Math.max(0, soldQty - priorReturned);

      if (returnQty > availableReturnQty) {
        return NextResponse.json(
          {
            error: `Return quantity (${returnQty}) exceeds available returnable quantity (${availableReturnQty}) for "${origItem.name}". (Sold: ${soldQty}, Already Returned: ${priorReturned})`,
          },
          { status: 400 }
        );
      }

      // Exact unit base price (after line discount if any)
      const lineNetBase = Math.max(0, Number(origItem.price) * soldQty - (Number(origItem.itemDiscount) || 0));
      const unitBasePrice = Math.round((lineNetBase / soldQty) * 100) / 100;
      const itemBaseTotal = Math.round(unitBasePrice * returnQty * 100) / 100;

      // Tax calculation
      const taxRate = Number(origItem.taxRate) || 0;
      let unitTaxAmount = 0;
      if (Number(origItem.taxAmount) > 0) {
        unitTaxAmount = Number(origItem.taxAmount) / soldQty;
      } else if (taxRate > 0) {
        unitTaxAmount = unitBasePrice * (taxRate / 100);
      }
      const itemTaxTotal = Math.round(unitTaxAmount * returnQty * 100) / 100;
      const itemGrandTotal = Math.round((itemBaseTotal + itemTaxTotal) * 100) / 100;

      totalBaseAmount += itemBaseTotal;
      totalTaxAmount += itemTaxTotal;
      totalReturnAmount += itemGrandTotal;

      let resolvedProdId = origItem.productId || origItem.product?.id || null;
      if (!resolvedProdId && (origItem.metadata as any)?.inputProductId) {
        resolvedProdId = (origItem.metadata as any).inputProductId;
      }

      validatedItems.push({
        origItemId: origItem.id,
        productId: resolvedProdId,
        name: origItem.name,
        qty: returnQty,
        unitBasePrice,
        baseAmount: itemBaseTotal,
        taxRate,
        taxAmount: itemTaxTotal,
        total: itemGrandTotal,
      });
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items selected for return" },
        { status: 400 }
      );
    }

    totalBaseAmount = Math.round(totalBaseAmount * 100) / 100;
    totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
    totalReturnAmount = Math.round(totalReturnAmount * 100) / 100;

    // Determine effective refund mode:
    // If invoice is CREDIT or has pending balance and refundMode is UDHARI_DEDUCTION or CREDIT
    const isCreditInvoice = invoice.paymentMode === PaymentMode.CREDIT || Number(invoice.balanceAmount) > 0;
    let effectiveRefundMode = refundMode;
    if (refundMode === "UDHARI_DEDUCTION" || (isCreditInvoice && refundMode === "CREDIT")) {
      effectiveRefundMode = "UDHARI_DEDUCTION";
    }

    // Run atomic return transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate unique return number
      const returnCount = await tx.salesReturn.count({ where: { tenantId: tenant.id } });
      const returnNo = `RET-${String(returnCount + 1).padStart(4, "0")}`;

      // 2. If refundMode is CREDIT_NOTE, create CreditNote record (Store Credit)
      let createdCreditNote: any = null;
      let creditNoteId: string | null = null;

      if (effectiveRefundMode === "CREDIT_NOTE") {
        const cnCount = await tx.creditNote.count({ where: { tenantId: tenant.id } });
        const creditNoteNo = `CN-${String(cnCount + 1).padStart(4, "0")}`;

        createdCreditNote = await tx.creditNote.create({
          data: {
            tenantId: tenant.id,
            invoiceId: invoice.id,
            creditNoteNo,
            amount: totalReturnAmount,
            reason: reason || `Sales Return for Bill #${invoice.invoiceNo}`,
            status: "OPEN",
          },
        });
        creditNoteId = createdCreditNote.id;
      }

      // 3. AUTOMATIC STOCK UPDATE (+): Increment stock back for each returned product
      for (const vi of validatedItems) {
        let targetProduct = null;

        // Try lookup by ID, productId, or barcode within tenant
        if (vi.productId) {
          targetProduct = await tx.product.findFirst({
            where: {
              tenantId: tenant.id,
              OR: [
                { id: vi.productId },
                { productId: vi.productId },
                { barcode: vi.productId },
              ],
            },
          });
        }

        // Fallback: lookup by name within tenant
        if (!targetProduct && vi.name) {
          targetProduct = await tx.product.findFirst({
            where: {
              tenantId: tenant.id,
              name: { equals: vi.name, mode: "insensitive" },
            },
          });
        }

        if (targetProduct) {
          const currentStock =
            targetProduct.stockQty !== null && targetProduct.stockQty !== undefined
              ? Number(targetProduct.stockQty)
              : 0;
          const newStock = currentStock + vi.qty;

          await tx.product.update({
            where: { id: targetProduct.id },
            data: {
              stockQty: newStock,
            },
          });
        }
      }

      // 4. CUSTOMER LEDGER & UDHARI SYNC:
      let previousCustomerCredit = 0;
      let updatedCustomerCredit = 0;
      let previousInvoiceBalance = Number(invoice.balanceAmount) || 0;
      let updatedInvoiceBalance = previousInvoiceBalance;

      if (invoice.customerId) {
        const cust = await tx.customer.findUnique({
          where: { id: invoice.customerId },
          select: { id: true, totalSpent: true, creditBalance: true },
        });

        if (cust) {
          previousCustomerCredit = Number(cust.creditBalance) || 0;
          updatedCustomerCredit = previousCustomerCredit;

          // If UDHARI_DEDUCTION or original bill was credit with pending balance:
          // Deduct from customer's Udhari balance
          if (effectiveRefundMode === "UDHARI_DEDUCTION" || isCreditInvoice) {
            updatedCustomerCredit = Math.max(0, Math.round((previousCustomerCredit - totalReturnAmount) * 100) / 100);
            
            // Deduct from invoice balanceAmount as well
            updatedInvoiceBalance = Math.max(0, Math.round((previousInvoiceBalance - totalReturnAmount) * 100) / 100);
            const updatedStatus = updatedInvoiceBalance === 0 ? InvoiceStatus.PAID : invoice.status;

            // Update customer Udhari
            await tx.customer.update({
              where: { id: cust.id },
              data: {
                creditBalance: updatedCustomerCredit,
              },
            });

            // Update invoice balance and status
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                balanceAmount: updatedInvoiceBalance,
                status: updatedStatus,
              },
            });
          }

          // In all return cases, decrement Customer totalSpent
          const currentSpent = Number(cust.totalSpent) || 0;
          const newSpent = Math.max(0, Math.round((currentSpent - totalReturnAmount) * 100) / 100);

          await tx.customer.update({
            where: { id: cust.id },
            data: {
              totalSpent: newSpent,
            },
          });
        }
      } else if (effectiveRefundMode === "UDHARI_DEDUCTION" || isCreditInvoice) {
        // If walk-in with credit balance on invoice
        updatedInvoiceBalance = Math.max(0, Math.round((previousInvoiceBalance - totalReturnAmount) * 100) / 100);
        const updatedStatus = updatedInvoiceBalance === 0 ? InvoiceStatus.PAID : invoice.status;

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            balanceAmount: updatedInvoiceBalance,
            status: updatedStatus,
          },
        });
      }

      // 5. Update invoice metadata with return audit trail
      const existingMeta = (invoice.metadata as any) || {};
      const returnHistory = Array.isArray(existingMeta.returns) ? existingMeta.returns : [];
      returnHistory.push({
        returnNo,
        returnDate: new Date().toISOString(),
        refundMode: effectiveRefundMode,
        amount: totalReturnAmount,
        taxAmount: totalTaxAmount,
        baseAmount: totalBaseAmount,
        items: validatedItems.map((vi) => ({
          name: vi.name,
          qty: vi.qty,
          price: vi.unitBasePrice,
          total: vi.total,
        })),
      });

      const totalReturnedOnInvoice = Math.round(((existingMeta.totalReturnedAmount || 0) + totalReturnAmount) * 100) / 100;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          metadata: {
            ...existingMeta,
            returns: returnHistory,
            totalReturnedAmount: totalReturnedOnInvoice,
            lastReturnDate: new Date().toISOString(),
          },
        },
      });

      // 6. Create SalesReturn & SalesReturnItem records
      const salesReturn = await tx.salesReturn.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          returnNo,
          totalAmount: totalReturnAmount,
          refundMode: effectiveRefundMode,
          reason: reason || null,
          productId: validatedItems[0]?.productId || null,
          productName: validatedItems.map((i) => i.name).join(", "),
          creditNoteId,
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              name: vi.name,
              qty: vi.qty,
              price: vi.unitBasePrice,
              total: vi.total,
            })),
          },
        },
        include: { items: true },
      });

      return {
        salesReturn,
        creditNote: createdCreditNote,
        previousCustomerCredit,
        updatedCustomerCredit,
        previousInvoiceBalance,
        updatedInvoiceBalance,
      };
    });

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

    return NextResponse.json(
      {
        success: true,
        salesReturn: {
          ...result.salesReturn,
          totalAmount: Number(result.salesReturn.totalAmount),
          items: result.salesReturn.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            qty: Number(i.qty),
            price: Number(i.price),
            total: Number(i.total),
          })),
        },
        creditNote: result.creditNote
          ? {
              ...result.creditNote,
              amount: Number(result.creditNote.amount),
            }
          : null,
        breakdown: {
          totalBaseAmount,
          totalTaxAmount,
          totalReturnAmount,
          items: validatedItems,
        },
        customerBalance: {
          previous: result.previousCustomerCredit,
          updated: result.updatedCustomerCredit,
        },
        invoiceBalance: {
          previous: result.previousInvoiceBalance,
          updated: result.updatedInvoiceBalance,
        },
        tenant: tenantDetails,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/returns error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to process return" },
      { status: 500 }
    );
  }
}

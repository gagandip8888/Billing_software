import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

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
        items: true,
      },
      orderBy: { returnDate: "desc" },
    });

    const serialized = returns.map((r) => {
      const walkInName = (r.invoice.metadata as any)?.walkInCustomerName;
      const walkInMobile = (r.invoice.metadata as any)?.walkInCustomerMobile;
      const customerData = r.invoice.customer
        ? r.invoice.customer
        : walkInName
        ? { id: "", name: walkInName, mobile: walkInMobile || "" }
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

    return NextResponse.json({ returns: serialized });
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

    // Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: tenant.id },
      include: { items: true, customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Validate return items against original invoice items
    let totalReturnAmount = 0;
    const validatedItems: Array<{
      productId?: string | null;
      name: string;
      qty: number;
      price: number;
      total: number;
    }> = [];

    for (const item of itemsToReturn) {
      const returnQty = Number(item.qty);
      if (!returnQty || returnQty <= 0) continue;

      const origItem = invoice.items.find((i) => i.id === item.id || i.name === item.name);
      if (!origItem) {
        return NextResponse.json(
          { error: `Item "${item.name}" not found on original invoice` },
          { status: 400 }
        );
      }

      if (returnQty > Number(origItem.qty)) {
        return NextResponse.json(
          { error: `Return quantity (${returnQty}) cannot exceed sold quantity (${Number(origItem.qty)}) for "${item.name}"` },
          { status: 400 }
        );
      }

      const itemPrice = Number(origItem.price);
      const itemTotal = Math.round(returnQty * itemPrice * 100) / 100;
      totalReturnAmount += itemTotal;

      let resolvedProdId = origItem.productId;
      if (!resolvedProdId && (origItem.metadata as any)?.inputProductId) {
        resolvedProdId = (origItem.metadata as any).inputProductId;
      }

      validatedItems.push({
        productId: resolvedProdId || null,
        name: origItem.name,
        qty: returnQty,
        price: itemPrice,
        total: itemTotal,
      });
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items selected for return" },
        { status: 400 }
      );
    }

    totalReturnAmount = Math.round(totalReturnAmount * 100) / 100;

    // Run atomic return transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate return number
      const returnCount = await tx.salesReturn.count({ where: { tenantId: tenant.id } });
      const returnNo = `RET-${String(returnCount + 1).padStart(4, "0")}`;

      // 2. If refundMode is CREDIT_NOTE, create credit note
      let createdCreditNote: any = null;
      let creditNoteId: string | null = null;

      if (refundMode === "CREDIT_NOTE" || refundMode === "CREDIT") {
        const cnCount = await tx.creditNote.count({ where: { tenantId: tenant.id } });
        const creditNoteNo = `CN-${String(cnCount + 1).padStart(4, "0")}`;

        createdCreditNote = await tx.creditNote.create({
          data: {
            tenantId: tenant.id,
            invoiceId: invoice.id,
            creditNoteNo,
            amount: totalReturnAmount,
            reason: reason || "Customer Return",
            status: "OPEN",
          },
        });
        creditNoteId = createdCreditNote.id;
      }

      // 3. Increment stock back for returned products
      for (const vi of validatedItems) {
        let targetProduct = null;

        // Try lookup by ID or productId
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

      // 4. Decrement Customer totalSpent if customer linked
      if (invoice.customerId) {
        const cust = await tx.customer.findUnique({
          where: { id: invoice.customerId },
          select: { totalSpent: true },
        });

        if (cust) {
          const currentSpent = Number(cust.totalSpent) || 0;
          const newSpent = Math.max(0, currentSpent - totalReturnAmount);

          await tx.customer.update({
            where: { id: invoice.customerId },
            data: {
              totalSpent: newSpent,
            },
          });
        }
      }

      // 5. Create SalesReturn record (creates a new return record, does not alter original invoice)
      const salesReturn = await tx.salesReturn.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          returnNo,
          totalAmount: totalReturnAmount,
          refundMode,
          reason: reason || null,
          productId: validatedItems[0]?.productId || null,
          productName: validatedItems.map((i) => i.name).join(", "),
          creditNoteId,
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              name: vi.name,
              qty: vi.qty,
              price: vi.price,
              total: vi.total,
            })),
          },
        },
        include: { items: true },
      });

      return { salesReturn, creditNote: createdCreditNote };
    });

    return NextResponse.json(
      {
        success: true,
        salesReturn: {
          ...result.salesReturn,
          totalAmount: Number(result.salesReturn.totalAmount),
        },
        creditNote: result.creditNote
          ? {
              ...result.creditNote,
              amount: Number(result.creditNote.amount),
            }
          : null,
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

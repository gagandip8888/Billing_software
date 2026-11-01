import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { invoiceSchema } from "@/lib/validations/invoice";
import { checkCanCreateBill } from "@/lib/subscription";
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  serializeInvoice,
} from "@/lib/invoice-utils";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) {
        where.invoiceDate.gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobile: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute queries sequentially for PgBouncer connection stability
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
          },
        },
        items: true,
      },
      orderBy: { invoiceDate: "desc" },
      skip,
      take: limit,
    });
    const total = await prisma.invoice.count({ where });

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      invoices: invoices.map(serializeInvoice),
      total,
      page,
      totalPages,
    });
  } catch (error: any) {
    console.error("GET /api/invoices error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch invoices", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Enforce subscription monthly bill limit
    const limitCheck = await checkCanCreateBill(tenant.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason || "Monthly bill limit reached for your plan.",
          code: "PLAN_LIMIT_EXCEEDED",
          billsThisMonth: limitCheck.billsThisMonth,
          billLimit: limitCheck.billLimit,
          plan: limitCheck.plan,
        },
        { status: 403 }
      );
    }

    // Server-side calculation of line taxes, subtotal, discount, item discounts, and totals
    const totals = calculateInvoiceTotals(
      data.items,
      data.discountAmount,
      data.amountPaid,
      data.creditNoteAmount || 0
    );

    const paymentRecords =
      data.payments && data.payments.length > 0
        ? data.payments
        : totals.paidAmount > 0
        ? [{ mode: data.paymentMode, amount: totals.paidAmount }]
        : [];

    // Run atomic transaction
    const createdInvoice = await prisma.$transaction(async (tx) => {
      // 1. Generate unique invoice number and increment setting
      const invoiceNo = await generateInvoiceNumber(tx, tenant.id);

      // 2. Resolve customer ID (if existing, or create if new details provided)
      let resolvedCustomerId = data.customerId || null;

      if (!resolvedCustomerId && data.customerMobile?.trim()) {
        const cleanMobile = data.customerMobile.trim();
        const existingCust = await tx.customer.findFirst({
          where: {
            tenantId: tenant.id,
            mobile: cleanMobile,
          },
        });

        if (existingCust) {
          resolvedCustomerId = existingCust.id;
        } else if (data.customerName?.trim()) {
          const now = new Date();
          const newCust = await tx.customer.create({
            data: {
              tenantId: tenant.id,
              name: data.customerName.trim(),
              mobile: cleanMobile,
              address: data.customerAddress?.trim() || null,
              gstNo: data.customerGstNo?.trim() || null,
              firstVisitAt: now,
              lastVisitAt: now,
              totalInvoices: 0,
            },
          });
          resolvedCustomerId = newCust.id;
        }
      }

      // 2.5 Resolve product foreign keys (supports DB cuid, user-facing productId e.g. "1001", or barcode)
      const resolvedItemsWithProduct = await Promise.all(
        totals.items.map(async (item) => {
          let linkedDbProductId: string | null = null;
          if (item.productId) {
            const p = await tx.product.findFirst({
              where: {
                tenantId: tenant.id,
                OR: [
                  { id: item.productId },
                  { productId: item.productId },
                  { barcode: item.productId },
                ],
              },
              select: { id: true },
            });
            if (p) {
              linkedDbProductId = p.id;
            }
          }
          return {
            ...item,
            linkedDbProductId,
          };
        })
      );

      // 3. Create the Invoice record with nested items
      const invoice = await tx.invoice.create({
        data: {
          tenantId: tenant.id,
          customerId: resolvedCustomerId,
          invoiceNo,
          invoiceDate: new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          paidAmount: totals.paidAmount,
          balanceAmount: totals.balanceAmount,
          paymentMode: data.paymentMode,
          payments: paymentRecords,
          status: totals.status,
          notes: data.notes ?? null,
          metadata: {
            ...(data.metadata || {}),
            creditNoteId: data.creditNoteId || null,
            creditNoteAmount: data.creditNoteAmount || null,
            walkInCustomerName: !resolvedCustomerId ? data.customerName : null,
            walkInCustomerMobile: !resolvedCustomerId ? data.customerMobile : null,
          },
          items: {
            create: resolvedItemsWithProduct.map((item) => ({
              productId: item.linkedDbProductId,
              name: item.name,
              size: item.size ?? null,
              color: item.color ?? null,
              brand: item.brand ?? null,
              mrp: item.mrp ?? null,
              qty: item.qty,
              price: item.price,
              itemDiscount: item.itemDiscount ?? 0,
              discountType: item.discountType ?? "amount",
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              total: item.total,
              metadata: {
                ...(item.metadata || {}),
                inputProductId: item.productId || null,
              },
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 4. Update customer aggregate statistics & udhari credit balance
      if (resolvedCustomerId) {
        const customerUpdateData: any = {
          totalBills: { increment: 1 },
          totalInvoices: { increment: 1 },
          totalSpent: { increment: totals.totalAmount },
          totalPaid: { increment: totals.paidAmount },
          lastVisitAt: new Date(),
        };

        if (totals.balanceAmount > 0 || data.paymentMode === "CREDIT" || totals.status === "UNPAID") {
          customerUpdateData.creditBalance = { increment: totals.balanceAmount };
        }

        await tx.customer.update({
          where: { id: resolvedCustomerId },
          data: customerUpdateData,
        });
      }

      // 5. If credit note was applied, mark it as USED
      if (data.creditNoteId) {
        try {
          await tx.creditNote.update({
            where: { id: data.creditNoteId },
            data: {
              status: "USED",
              usedInInvoiceId: invoice.id,
            },
          });
        } catch (cnErr) {
          console.warn("Could not mark credit note as used:", cnErr);
        }
      }

      // 6. Decrement inventory stock for linked products
      for (const item of resolvedItemsWithProduct) {
        if (item.linkedDbProductId) {
          try {
            await tx.product.update({
              where: {
                id: item.linkedDbProductId,
                tenantId: tenant.id,
              },
              data: {
                stockQty: {
                  decrement: item.qty,
                },
              },
            });
          } catch (e) {
            console.warn(`Could not decrement stock for product ${item.linkedDbProductId}:`, e);
          }
        }
      }

      return invoice;
    });

    return NextResponse.json(
      { invoice: serializeInvoice(createdInvoice) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { PaymentMode } from "@prisma/client";

interface RouteParams {
  params: {
    customerId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { customerId } = params;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: tenant.id },
      include: {
        invoices: {
          orderBy: { invoiceDate: "asc" },
        },
        paymentReceipts: {
          orderBy: { receivedAt: "asc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Build chronological ledger entries
    type LedgerEntry = {
      id: string;
      date: string;
      type: "INVOICE" | "PAYMENT";
      title: string;
      reference?: string | null;
      debit: number; // bill amount
      credit: number; // payment received
      balanceAfter?: number;
      paymentMode?: string;
      note?: string | null;
    };

    const entries: LedgerEntry[] = [];

    customer.invoices.forEach((inv) => {
      entries.push({
        id: inv.id,
        date: inv.invoiceDate.toISOString(),
        type: "INVOICE",
        title: `Bill ${inv.invoiceNo}`,
        reference: inv.invoiceNo,
        debit: Number(inv.totalAmount),
        credit: Number(inv.paidAmount),
        paymentMode: inv.paymentMode,
        note: inv.notes,
      });
    });

    customer.paymentReceipts.forEach((pr) => {
      entries.push({
        id: pr.id,
        date: pr.receivedAt.toISOString(),
        type: "PAYMENT",
        title: `Payment Received (${pr.paymentMode})`,
        reference: pr.reference,
        debit: 0,
        credit: Number(pr.amount),
        paymentMode: pr.paymentMode,
        note: pr.note,
      });
    });

    // Sort chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        creditBalance: Number(customer.creditBalance),
        totalSpent: Number(customer.totalSpent),
        totalPaid: Number(customer.totalPaid),
      },
      ledger: entries,
    });
  } catch (error: any) {
    console.error(`GET /api/udhari/${params.customerId} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch customer ledger" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { customerId } = params;
    const body = await req.json();

    const { amount, paymentMode, reference, note } = body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: tenant.id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const validMode = Object.values(PaymentMode).includes(paymentMode)
      ? paymentMode
      : PaymentMode.CASH;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create PaymentReceipt
      const receipt = await tx.paymentReceipt.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          amount: numAmount,
          paymentMode: validMode,
          reference: reference || null,
          note: note || null,
          receivedAt: new Date(),
        },
      });

      // 2. Reduce customer creditBalance
      const currentCredit = Number(customer.creditBalance);
      const newCreditBalance = Math.max(0, currentCredit - numAmount);

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          creditBalance: newCreditBalance,
          totalPaid: { increment: numAmount },
        },
      });

      // 3. Clear or reduce balance on unpaid invoices chronologically
      let remainingPayment = numAmount;
      const unpaidInvoices = await tx.invoice.findMany({
        where: {
          tenantId: tenant.id,
          customerId: customer.id,
          balanceAmount: { gt: 0 },
        },
        orderBy: { invoiceDate: "asc" },
      });

      for (const inv of unpaidInvoices) {
        if (remainingPayment <= 0) break;
        const invBalance = Number(inv.balanceAmount);
        const invPaid = Number(inv.paidAmount);

        if (remainingPayment >= invBalance) {
          remainingPayment -= invBalance;
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: Number(inv.totalAmount),
              balanceAmount: 0,
              status: "PAID",
            },
          });
        } else {
          const newPaid = invPaid + remainingPayment;
          const newBal = invBalance - remainingPayment;
          remainingPayment = 0;
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: newPaid,
              balanceAmount: newBal,
              status: "PARTIAL",
            },
          });
        }
      }

      return { receipt, customer: updatedCustomer };
    });

    return NextResponse.json(
      {
        success: true,
        receipt: result.receipt,
        customer: {
          id: result.customer.id,
          name: result.customer.name,
          creditBalance: Number(result.customer.creditBalance),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`POST /api/udhari/${params.customerId} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}

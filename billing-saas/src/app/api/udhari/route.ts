import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: any = {
      tenantId: tenant.id,
      creditBalance: {
        gt: 0,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        mobile: true,
        creditBalance: true,
        totalPaid: true,
        totalSpent: true,
        lastVisitAt: true,
        invoices: {
          select: {
            id: true,
            invoiceNo: true,
            invoiceDate: true,
            totalAmount: true,
            balanceAmount: true,
          },
          orderBy: { invoiceDate: "desc" },
          take: 1,
        },
        paymentReceipts: {
          select: {
            id: true,
            amount: true,
            receivedAt: true,
            paymentMode: true,
          },
          orderBy: { receivedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { creditBalance: "desc" },
    });

    const serialized = customers.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      creditBalance: Number(c.creditBalance),
      totalPaid: Number(c.totalPaid),
      totalSpent: Number(c.totalSpent),
      lastPurchase: c.invoices[0]
        ? {
            invoiceNo: c.invoices[0].invoiceNo,
            date: c.invoices[0].invoiceDate.toISOString(),
            amount: Number(c.invoices[0].totalAmount),
            balance: Number(c.invoices[0].balanceAmount),
          }
        : null,
      lastPayment: c.paymentReceipts[0]
        ? {
            amount: Number(c.paymentReceipts[0].amount),
            date: c.paymentReceipts[0].receivedAt.toISOString(),
            mode: c.paymentReceipts[0].paymentMode,
          }
        : null,
    }));

    const totalPending = serialized.reduce((sum, c) => sum + c.creditBalance, 0);

    return NextResponse.json({
      customers: serialized,
      totalPending: Math.round(totalPending * 100) / 100,
      count: serialized.length,
    });
  } catch (error: any) {
    console.error("GET /api/udhari error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch udhari ledger" },
      { status: 500 }
    );
  }
}

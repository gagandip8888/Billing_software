import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    // Find customers where lastVisitAt < 8 months ago
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

    const dormantCustomers = await prisma.customer.findMany({
      where: {
        tenantId: tenant.id,
        lastVisitAt: { lt: eightMonthsAgo },
        autoDeletedAt: null,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
      },
    });

    let cleanedCount = 0;

    for (const cust of dormantCustomers) {
      await prisma.$transaction(async (tx) => {
        // 1. Anonymize data: keep name + mobile, clear address, notes, mark autoDeletedAt
        await tx.customer.update({
          where: { id: cust.id },
          data: {
            address: null,
            notes: null,
            autoDeletedAt: new Date(),
          },
        });

        // 2. Soft-delete invoices older than 8 months
        await tx.invoice.updateMany({
          where: {
            tenantId: tenant.id,
            customerId: cust.id,
            invoiceDate: { lt: eightMonthsAgo },
          },
          data: {
            status: "CANCELLED",
            notes: "Auto-pruned after 8 months inactivity",
          },
        });
      });

      cleanedCount++;
    }

    return NextResponse.json({
      success: true,
      cleanedCount,
      cutoffDate: eightMonthsAgo.toISOString(),
      message: `Cleaned and anonymized ${cleanedCount} dormant customers (inactivity > 8 months)`,
    });
  } catch (error: any) {
    console.error("POST /api/customers/cleanup error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to run customer cleanup" },
      { status: 500 }
    );
  }
}

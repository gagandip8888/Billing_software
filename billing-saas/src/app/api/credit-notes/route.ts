import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");

    const where: any = {
      tenantId: tenant.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (customerId) {
      where.invoice = {
        customerId,
      };
    }

    const creditNotes = await prisma.creditNote.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
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
      orderBy: { createdAt: "desc" },
    });

    const serialized = creditNotes.map((cn) => ({
      id: cn.id,
      creditNoteNo: cn.creditNoteNo,
      amount: Number(cn.amount),
      reason: cn.reason,
      status: cn.status,
      usedInInvoiceId: cn.usedInInvoiceId,
      expiresAt: cn.expiresAt ? cn.expiresAt.toISOString() : null,
      createdAt: cn.createdAt.toISOString(),
      invoice: cn.invoice
        ? {
            id: cn.invoice.id,
            invoiceNo: cn.invoice.invoiceNo,
            customer: cn.invoice.customer,
          }
        : null,
    }));

    return NextResponse.json({ creditNotes: serialized });
  } catch (error: any) {
    console.error("GET /api/credit-notes error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch credit notes" },
      { status: 500 }
    );
  }
}

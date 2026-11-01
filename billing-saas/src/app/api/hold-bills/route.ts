import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const holdBills = await prisma.holdBill.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ holdBills });
  } catch (error: any) {
    console.error("GET /api/hold-bills error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch held bills" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { customerName, customerMobile, payload, note, cashierId } = body;

    if (!payload || !payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { error: "Cannot hold an empty bill" },
        { status: 400 }
      );
    }

    const holdBill = await prisma.holdBill.create({
      data: {
        tenantId: tenant.id,
        cashierId: cashierId || null,
        customerName: customerName || payload.customerName || null,
        customerMobile: customerMobile || payload.customerMobile || null,
        payload,
        note: note || null,
      },
    });

    return NextResponse.json({ holdBill }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/hold-bills error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to hold bill" },
      { status: 500 }
    );
  }
}

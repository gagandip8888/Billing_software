import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const holdBill = await prisma.holdBill.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!holdBill) {
      return NextResponse.json({ error: "Held bill not found" }, { status: 404 });
    }

    return NextResponse.json({ holdBill });
  } catch (error: any) {
    console.error(`GET /api/hold-bills/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch held bill" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const existing = await prisma.holdBill.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Held bill not found" }, { status: 404 });
    }

    await prisma.holdBill.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Held bill removed" });
  } catch (error: any) {
    console.error(`DELETE /api/hold-bills/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete held bill" },
      { status: 500 }
    );
  }
}

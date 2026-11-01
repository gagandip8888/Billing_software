import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

async function handleBulkDelete(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No product IDs provided" },
        { status: 400 }
      );
    }

    // Soft-delete products belonging to this tenant by setting isActive to false
    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids },
        tenantId: tenant.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} product(s) deleted successfully`,
    });
  } catch (error: any) {
    console.error("Bulk delete products error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to delete products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleBulkDelete(req);
}

export async function DELETE(req: NextRequest) {
  return handleBulkDelete(req);
}


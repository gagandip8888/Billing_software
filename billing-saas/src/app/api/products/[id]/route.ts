import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { productUpdateSchema } from "@/lib/validations/product";
import { serializeProduct } from "@/lib/products";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error: any) {
    console.error(`GET /api/products/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    // Verify tenant ownership
    const existing = await prisma.product.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.category !== undefined) updateData.category = data.category ?? null;
    if (data.size !== undefined) updateData.size = data.size ?? null;
    if (data.color !== undefined) updateData.color = data.color ?? null;
    if (data.brand !== undefined) updateData.brand = data.brand ?? null;
    if (data.mrp !== undefined) updateData.mrp = data.mrp ?? null;
    if (data.variantGroupId !== undefined) updateData.variantGroupId = data.variantGroupId ?? null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice ?? null;
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
    if (data.hsnCode !== undefined) updateData.hsnCode = data.hsnCode ?? null;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.stockQty !== undefined) updateData.stockQty = data.stockQty ?? null;
    if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert ?? null;
    if (data.barcode !== undefined) updateData.barcode = data.barcode ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) {
      updateData.metadata = {
        ...((existing.metadata as object) || {}),
        ...(data.metadata || {}),
      };
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ product: serializeProduct(updated) });
  } catch (error: any) {
    console.error(`PATCH /api/products/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const tenant = await requireTenant();
    const { id } = params;

    const existing = await prisma.product.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      // Hard delete from database
      await prisma.product.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        success: true,
        message: "Product permanently deleted",
      });
    }

    // Default: Soft delete (set isActive to false)
    const softDeleted = await prisma.product.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
      product: serializeProduct(softDeleted),
    });
  } catch (error: any) {
    console.error(`DELETE /api/products/${params.id} error:`, error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

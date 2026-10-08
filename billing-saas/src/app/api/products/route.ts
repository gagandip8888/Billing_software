import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { productSchema } from "@/lib/validations/product";
import { serializeProduct } from "@/lib/products";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const isActiveParam = searchParams.get("isActive");

    const where: any = {
      tenantId: tenant.id,
    };

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== "all") {
      where.isActive = isActiveParam === "true";
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { hsnCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map(serializeProduct),
      total,
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const newProduct = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        description: data.description ?? null,
        category: data.category ?? null,
        price: data.price,
        costPrice: data.costPrice ?? null,
        taxRate: data.taxRate ?? 18,
        hsnCode: data.hsnCode ?? null,
        unit: data.unit ?? "pc",
        stockQty: data.stockQty ?? null,
        lowStockAlert: data.lowStockAlert ?? null,
        barcode: data.barcode ?? null,
        metadata: data.metadata ?? {},
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(
      { product: serializeProduct(newProduct) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

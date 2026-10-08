import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: any = {
      tenantId: tenant.id,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { gstNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/customers error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    if (!body.name || !body.mobile) {
      return NextResponse.json(
        { error: "Name and Mobile number are required" },
        { status: 400 }
      );
    }

    // Check if customer with this mobile already exists for this tenant
    const existing = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        mobile: body.mobile.trim(),
      },
    });

    if (existing) {
      return NextResponse.json({
        customer: {
          ...existing,
          totalSpent: Number(existing.totalSpent),
        },
      });
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: body.name.trim(),
        mobile: body.mobile.trim(),
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        gstNo: body.gstNo?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        customer: {
          ...customer,
          totalSpent: Number(customer.totalSpent),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/customers error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to save customer" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ invoices: [], products: [], customers: [] });
    }

    const [invoices, products, customers] = await Promise.all([
      // Search Invoices
      prisma.invoice.findMany({
        where: {
          tenantId: tenant.id,
          OR: [
            { invoiceNo: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          invoiceNo: true,
          totalAmount: true,
          status: true,
          customer: { select: { name: true } },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),

      // Search Products
      prisma.product.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { barcode: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          stockQty: true,
        },
        take: 4,
        orderBy: { name: "asc" },
      }),

      // Search Customers
      prisma.customer.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { mobile: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          creditBalance: true,
        },
        take: 4,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        title: `Bill ${inv.invoiceNo}`,
        subtitle: inv.customer?.name || "Walk-in",
        badge: `₹${Number(inv.totalAmount).toLocaleString("en-IN")}`,
        href: `/invoices?search=${encodeURIComponent(inv.invoiceNo)}`,
      })),
      products: products.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.stockQty !== null ? `Stock: ${Number(p.stockQty)}` : "In stock",
        badge: `₹${Number(p.price).toLocaleString("en-IN")}`,
        href: `/products?search=${encodeURIComponent(p.name)}`,
      })),
      customers: customers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.mobile,
        badge: Number(c.creditBalance) > 0 ? `₹${Number(c.creditBalance)} due` : "No dues",
        href: `/udhari`,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ invoices: [], products: [], customers: [] }, { status: 500 });
  }
}

import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ProductsView } from "@/components/products/ProductsView";
import { serializeProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const tenant = await requireTenant();

  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedProducts = products.map(serializeProduct);

  return (
    <ProductsView
      initialProducts={serializedProducts}
      shopType={tenant.shopType}
      businessName={tenant.businessName}
    />
  );
}

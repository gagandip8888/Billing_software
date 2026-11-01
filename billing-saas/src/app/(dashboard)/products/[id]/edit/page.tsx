import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import { serializeProduct } from "@/lib/products";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const tenant = await requireTenant();
  const { id } = params;

  const product = await prisma.product.findFirst({
    where: {
      id,
      tenantId: tenant.id,
    },
  });

  if (!product) {
    notFound();
  }

  const serialized = serializeProduct(product);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            Edit: {serialized.name}
          </h1>
          <p className="text-xs text-slate-500">
            Update pricing, inventory levels, or dynamic shop fields
          </p>
        </div>
      </div>

      {/* FORM WRAPPER */}
      <ProductForm initialData={serialized} shopType={tenant.shopType} />
    </div>
  );
}

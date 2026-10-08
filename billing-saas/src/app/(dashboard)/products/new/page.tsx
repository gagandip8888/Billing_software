import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { ProductForm } from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  const tenant = await requireTenant();

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
            <PackagePlus className="h-5 w-5 text-blue-600" />
            Add New Product or Service
          </h1>
          <p className="text-xs text-slate-500">
            Create a catalog item with dynamic attributes customized for{" "}
            <span className="font-semibold text-slate-700 capitalize">
              {tenant.shopType.toLowerCase().replace(/_/g, " ")}
            </span>
          </p>
        </div>
      </div>

      {/* FORM WRAPPER */}
      <ProductForm shopType={tenant.shopType} />
    </div>
  );
}

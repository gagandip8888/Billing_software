-- AlterTable
ALTER TABLE "products" ADD COLUMN "size" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "brand" TEXT,
ADD COLUMN "mrp" DECIMAL(10,2),
ADD COLUMN "variantGroupId" TEXT;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN "size" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "brand" TEXT,
ADD COLUMN "mrp" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "products_tenantId_variantGroupId_idx" ON "products"("tenantId", "variantGroupId");

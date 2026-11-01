-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "payments" JSONB;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN "itemDiscount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "discountType" TEXT DEFAULT 'amount';

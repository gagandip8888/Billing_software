-- CreateTable
CREATE TABLE "hold_bills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cashierId" TEXT,
    "customerName" TEXT,
    "customerMobile" TEXT,
    "payload" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hold_bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hold_bills_tenantId_createdAt_idx" ON "hold_bills"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "hold_bills" ADD CONSTRAINT "hold_bills_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "Contact_callCount_idx";

-- AlterTable
ALTER TABLE "NumberPool" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "CallRecord_tenantId_createdAt_idx" ON "CallRecord"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Contact_tenantId_callCount_idx" ON "Contact"("tenantId", "callCount");

-- CreateIndex
CREATE INDEX "NumberPool_tenantId_idx" ON "NumberPool"("tenantId");

-- AddForeignKey
ALTER TABLE "NumberPool" ADD CONSTRAINT "NumberPool_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

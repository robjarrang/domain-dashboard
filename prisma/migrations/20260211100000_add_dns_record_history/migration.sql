-- CreateEnum
CREATE TYPE "DNSRecordType" AS ENUM ('DKIM', 'SPF', 'DMARC');

-- CreateTable
CREATE TABLE "DNSRecordHistory" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "recordType" "DNSRecordType" NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DNSRecordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DNSRecordHistory_domainId_changedAt_idx" ON "DNSRecordHistory"("domainId", "changedAt" DESC);

-- AddForeignKey
ALTER TABLE "DNSRecordHistory" ADD CONSTRAINT "DNSRecordHistory_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

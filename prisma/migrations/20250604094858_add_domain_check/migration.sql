-- CreateTable
CREATE TABLE "DomainCheck" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "dkim" TEXT,
    "spf" TEXT,
    "dmarc" TEXT,
    "dkimStatus" TEXT,
    "spfStatus" TEXT,
    "dmarcStatus" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DomainCheck_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DomainCheck" ADD CONSTRAINT "DomainCheck_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

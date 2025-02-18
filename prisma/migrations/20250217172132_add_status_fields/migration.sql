-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "dkimStatus" TEXT,
ADD COLUMN     "dmarcStatus" TEXT,
ADD COLUMN     "spfStatus" TEXT;

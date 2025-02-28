-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "espId" TEXT;

-- CreateTable
CREATE TABLE "ESP" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ESP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ESP_name_key" ON "ESP"("name");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_espId_fkey" FOREIGN KEY ("espId") REFERENCES "ESP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `logoUpdatedAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Company` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[domain]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Company_name_key";

-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "logoUpdatedAt",
DROP COLUMN "logoUrl";

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "public"."Company"("domain");

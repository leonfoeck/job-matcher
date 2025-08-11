/*
  Warnings:

  - You are about to drop the column `baseUrl` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Company" DROP COLUMN "baseUrl",
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "logoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT;

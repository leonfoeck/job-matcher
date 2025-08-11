/*
  Warnings:

  - The `description` column on the `Experience` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Experience" DROP COLUMN "description",
ADD COLUMN     "description" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "description",
ADD COLUMN     "description" TEXT[] DEFAULT ARRAY[]::TEXT[];

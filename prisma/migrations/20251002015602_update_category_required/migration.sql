/*
  Warnings:

  - Made the column `category` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'other';

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- Add check constraint to ensure only valid category values
ALTER TABLE "Project" ADD CONSTRAINT "Project_category_check"
  CHECK ("category" IN ('article', 'analysis', 'tutorial', 'software_implementation', 'other'));

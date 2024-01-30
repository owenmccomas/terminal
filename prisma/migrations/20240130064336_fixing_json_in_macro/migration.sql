/*
  Warnings:

  - The `macros` column on the `Macro` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Macro" DROP COLUMN "macros",
ADD COLUMN     "macros" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Macro_userId_macros_key" ON "Macro"("userId", "macros");

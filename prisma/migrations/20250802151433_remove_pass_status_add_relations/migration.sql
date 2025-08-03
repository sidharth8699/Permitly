/*
  Warnings:

  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Pass` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "status",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Pass" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "created_by_guard_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_created_by_guard_id_fkey" FOREIGN KEY ("created_by_guard_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

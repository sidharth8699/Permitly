/*
  Warnings:

  - You are about to drop the column `entry_time` on the `Pass` table. All the data in the column will be lost.
  - You are about to drop the column `exit_time` on the `Pass` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pass" DROP COLUMN "entry_time",
DROP COLUMN "exit_time";

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "entry_time" TIMESTAMP(3),
ADD COLUMN     "exit_time" TIMESTAMP(3);

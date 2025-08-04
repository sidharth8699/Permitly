/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Visitor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HOST', 'GUARD');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "visitor_id" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'HOST';

-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "status",
ADD COLUMN     "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "Visitor"("visitor_id") ON DELETE SET NULL ON UPDATE CASCADE;

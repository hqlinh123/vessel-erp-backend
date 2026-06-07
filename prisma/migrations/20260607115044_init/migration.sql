/*
  Warnings:

  - The values [OPEN] on the enum `WorkOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `certificateNo` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `issuer` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `expectedDate` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `orderDate` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `receivedDate` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `receivedQuantity` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `SparePart` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SparePart` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `WorkOrderAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `WorkOrderAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `WorkOrderAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifiedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vessel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certificate_documents` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Made the column `vesselId` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roleId` on table `UserInvite` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VesselType" AS ENUM ('BULK_CARRIER', 'CONTAINER', 'TANKER', 'LNG', 'LPG', 'OFFSHORE', 'TUG', 'FERRY', 'RO_RO', 'GENERAL_CARGO', 'OTHER');

-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'PENDING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockMovementType" ADD VALUE 'IN';
ALTER TYPE "StockMovementType" ADD VALUE 'OUT';
ALTER TYPE "StockMovementType" ADD VALUE 'SCRAPPED';

-- AlterEnum
BEGIN;
CREATE TYPE "WorkOrderStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');
ALTER TABLE "public"."WorkOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WorkOrder" ALTER COLUMN "status" TYPE "WorkOrderStatus_new" USING ("status"::text::"WorkOrderStatus_new");
ALTER TYPE "WorkOrderStatus" RENAME TO "WorkOrderStatus_old";
ALTER TYPE "WorkOrderStatus_new" RENAME TO "WorkOrderStatus";
DROP TYPE "public"."WorkOrderStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_companyId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceJob" DROP CONSTRAINT "MaintenanceJob_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordReset" DROP CONSTRAINT "PasswordReset_userId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "SparePart" DROP CONSTRAINT "SparePart_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_sparePartId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserInvite" DROP CONSTRAINT "UserInvite_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserInvite" DROP CONSTRAINT "UserInvite_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_companyId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_maintenanceJobId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderAttachment" DROP CONSTRAINT "WorkOrderAttachment_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrderAttachment" DROP CONSTRAINT "WorkOrderAttachment_workOrderId_fkey";

-- DropForeignKey
ALTER TABLE "certificate_documents" DROP CONSTRAINT "certificate_documents_certificateId_fkey";

-- DropForeignKey
ALTER TABLE "certificate_documents" DROP CONSTRAINT "certificate_documents_fileId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropIndex
DROP INDEX "Certificate_expiryDate_idx";

-- DropIndex
DROP INDEX "Certificate_status_idx";

-- DropIndex
DROP INDEX "Certificate_vesselId_idx";

-- DropIndex
DROP INDEX "Document_companyId_idx";

-- DropIndex
DROP INDEX "Document_vesselId_idx";

-- DropIndex
DROP INDEX "MaintenanceJob_equipmentId_code_key";

-- DropIndex
DROP INDEX "PasswordReset_token_idx";

-- DropIndex
DROP INDEX "PasswordReset_userId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_status_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_supplierId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderItem_purchaseOrderId_sparePartId_key";

-- DropIndex
DROP INDEX "Role_code_key";

-- DropIndex
DROP INDEX "StockMovement_createdAt_idx";

-- DropIndex
DROP INDEX "Supplier_companyId_code_key";

-- DropIndex
DROP INDEX "UserInvite_companyId_idx";

-- DropIndex
DROP INDEX "UserInvite_email_idx";

-- DropIndex
DROP INDEX "UserInvite_token_idx";

-- DropIndex
DROP INDEX "WorkOrder_assignedToId_idx";

-- DropIndex
DROP INDEX "WorkOrder_dueDate_idx";

-- DropIndex
DROP INDEX "WorkOrder_status_idx";

-- DropIndex
DROP INDEX "WorkOrder_vesselId_idx";

-- DropIndex
DROP INDEX "WorkOrderAttachment_workOrderId_idx";

-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "certificateNo",
DROP COLUMN "issuer",
DROP COLUMN "remarks",
DROP COLUMN "status",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category",
DROP COLUMN "companyId",
DROP COLUMN "fileSize",
DROP COLUMN "mimeType",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
DROP COLUMN "version",
ALTER COLUMN "vesselId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "model" TEXT,
ADD COLUMN     "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "MaintenanceJob" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdAt",
DROP COLUMN "description";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "expectedDate",
DROP COLUMN "notes",
DROP COLUMN "orderDate",
DROP COLUMN "receivedDate",
DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "createdAt",
DROP COLUMN "receivedQuantity";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "code",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "SparePart" DROP COLUMN "location",
DROP COLUMN "updatedAt",
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "minimumStock" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "reference",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" TEXT,
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "address",
DROP COLUMN "code",
DROP COLUMN "contactPerson",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "UserInvite" ALTER COLUMN "roleId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkOrder" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WorkOrderAttachment" DROP COLUMN "fileSize",
DROP COLUMN "mimeType",
DROP COLUMN "uploadedById";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT 'Asia/Ho_Chi_Minh',
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "emailVerifiedAt",
DROP COLUMN "lastActive",
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "userType" DROP DEFAULT,
ALTER COLUMN "companyId" SET NOT NULL;

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "RefreshToken";

-- DropTable
DROP TABLE "Vessel";

-- DropTable
DROP TABLE "certificate_documents";

-- DropEnum
DROP TYPE "CertificateStatus";

-- DropEnum
DROP TYPE "CompanyStatus";

-- DropEnum
DROP TYPE "DocumentCategory";

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imoNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "breadth" DOUBLE PRECISION,
    "buildYear" INTEGER,
    "builderYard" TEXT,
    "callSign" TEXT,
    "classificationSociety" TEXT,
    "code" TEXT,
    "deadweight" DOUBLE PRECISION,
    "draft" DOUBLE PRECISION,
    "engineMaker" TEXT,
    "engineModel" TEXT,
    "flag" TEXT,
    "grossTonnage" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "lengthOverall" DOUBLE PRECISION,
    "mmsiNumber" TEXT,
    "netTonnage" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "VesselStatus" NOT NULL DEFAULT 'ACTIVE',
    "vesselType" "VesselType" NOT NULL,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "signOnDate" TIMESTAMP(3),
    "signOffDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vessels_imoNumber_key" ON "vessels"("imoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_code_key" ON "vessels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_mmsiNumber_key" ON "vessels"("mmsiNumber");

-- CreateIndex
CREATE INDEX "vessels_companyId_idx" ON "vessels"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_token_key" ON "EmailVerification"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceJob" ADD CONSTRAINT "MaintenanceJob_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_maintenanceJobId_fkey" FOREIGN KEY ("maintenanceJobId") REFERENCES "MaintenanceJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAttachment" ADD CONSTRAINT "WorkOrderAttachment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

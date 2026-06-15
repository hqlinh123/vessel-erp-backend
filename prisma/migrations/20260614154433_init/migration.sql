-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "UserInvite" ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

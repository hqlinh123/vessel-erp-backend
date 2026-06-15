-- AlterTable
ALTER TABLE "UserInvite" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "lastName" TEXT;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

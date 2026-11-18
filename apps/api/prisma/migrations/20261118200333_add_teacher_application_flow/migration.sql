/*
  Warnings:

  - Added the required column `mimeType` to the `verification_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `verification_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `verification_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "DocumentKind" ADD VALUE 'APPROVED_SUBJECTS_CERTIFICATE';

-- AlterEnum
ALTER TYPE "TeacherStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "teacher_profiles" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verification_documents" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "deleted_by_one" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_two" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "shareExpires" TIMESTAMP(3),
ADD COLUMN     "shareId" SERIAL NOT NULL,
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "shareExpires" TIMESTAMP(3),
ADD COLUMN     "shareId" SERIAL NOT NULL,
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

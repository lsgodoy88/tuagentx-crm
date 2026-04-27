-- AlterTable
ALTER TABLE "PanelUser" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'basico';

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "instance" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "evoToken" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "catalogoId" TEXT NOT NULL,
    "politicasId" TEXT NOT NULL,
    "faqId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "configurado" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bot_instance_key" ON "Bot"("instance");

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PanelUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

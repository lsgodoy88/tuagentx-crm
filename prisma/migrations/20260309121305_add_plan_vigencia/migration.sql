-- AlterTable
ALTER TABLE "PanelUser" ADD COLUMN     "periodicidad" TEXT NOT NULL DEFAULT 'mensual',
ADD COLUMN     "planActivo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "planFin" TIMESTAMP(3),
ADD COLUMN     "planInicio" TIMESTAMP(3);

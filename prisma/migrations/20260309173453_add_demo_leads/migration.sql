-- CreateTable
CREATE TABLE "DemoLead" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "negocio" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "precio" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "mensajes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoBot" (
    "id" TEXT NOT NULL,
    "instance" TEXT NOT NULL,
    "numeroDemo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoBot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoBot_instance_key" ON "DemoBot"("instance");

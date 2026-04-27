import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nombre, cedula, direccion, observacion } = await req.json()

  const venta = await prisma.venta.update({
    where: { id },
    data: {
      cliente: nombre || undefined,
      cedula: cedula || null,
      direccion: direccion || null,
      observacion: observacion || null,
    }
  })
  return NextResponse.json(venta)
}

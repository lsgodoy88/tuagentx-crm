import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const funcionalidades = await (prisma as any).precioFuncionalidad.findMany({
    where: { activo: true },
    orderBy: { precio: 'desc' },
  })
  return NextResponse.json({ funcionalidades })
}

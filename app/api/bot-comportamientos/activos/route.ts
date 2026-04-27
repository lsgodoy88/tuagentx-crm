import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const lista = await prisma.botComportamiento.findMany({
    where: { activo: true },
    orderBy: [{ prioridad: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, trigger: true, tipo: true, respuesta: true, accion: true, prioridad: true },
  })
  return NextResponse.json(lista)
}

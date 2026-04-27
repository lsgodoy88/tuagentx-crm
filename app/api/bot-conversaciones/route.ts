import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const instancia = searchParams.get('instancia') || undefined
  const estado    = searchParams.get('estado')    || undefined

  const lista = await prisma.botConversacion.findMany({
    where: {
      ...(instancia ? { instancia } : {}),
      ...(estado    ? { estado }    : {}),
    },
    include: {
      mensajes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { contenido: true, rol: true, createdAt: true },
      },
      _count: { select: { mensajes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(lista)
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const conv = await prisma.botConversacion.findUnique({
    where: { id },
    include: {
      mensajes: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!conv) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(conv)
}

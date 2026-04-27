import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const items = await (prisma as any).marketing.findMany({
    where: { ownerId: panelUser.id },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const body = await req.json()
  const item = await (prisma as any).marketing.create({
    data: {
      ownerId: panelUser.id,
      titulo: body.titulo || 'Sin título',
      copy: body.copy || '',
      imagen: body.imagen || null,
      imagenFinal: body.imagenFinal || null,
      instancias: body.instancias || '[]',
      canales: body.canales || '[]',
      estado: body.estado || 'borrador',
      programadoEl: body.programadoEl ? new Date(body.programadoEl) : null,
    }
  })
  return NextResponse.json(item)
}

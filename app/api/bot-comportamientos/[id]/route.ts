import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidarCacheComportamientos } from '@/lib/redis'

async function adminOnly() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const user = session.user as any
  if (user.role !== 'admin') return null
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await adminOnly()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.trigger    !== undefined) data.trigger    = body.trigger.trim()
  if (body.tipo       !== undefined) data.tipo       = body.tipo
  if (body.respuesta  !== undefined) data.respuesta  = body.respuesta || null
  if (body.accion     !== undefined) data.accion     = body.accion || null
  if (body.activo     !== undefined) data.activo     = body.activo
  if (body.prioridad  !== undefined) data.prioridad  = body.prioridad

  const row = await prisma.botComportamiento.update({ where: { id }, data })
  await invalidarCacheComportamientos()
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await adminOnly()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.botComportamiento.delete({ where: { id } })
  await invalidarCacheComportamientos()
  return NextResponse.json({ ok: true })
}

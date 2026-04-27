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
  const servicios = await prisma.servicio.findMany({
    where: { ownerId: panelUser.id },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(servicios)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const { nombre, descripcion, precio, tipo, activo } = await req.json()
  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  const servicio = await prisma.servicio.create({
    data: {
      id: crypto.randomUUID(),
      ownerId: panelUser.id,
      nombre,
      descripcion: descripcion || null,
      precio: precio ? Number(precio) : null,
      tipo: tipo || 'fijo',
      activo: activo !== false
    }
  })
  return NextResponse.json(servicio)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json()
  await prisma.servicio.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

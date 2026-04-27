import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const producto = await prisma.producto.update({
    where: { id },
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion,
      costo: Number(body.costo),
      precio: Number(body.precio),
      stockMin: Number(body.stockMin),
      activo: body.activo !== undefined ? body.activo : true,
    }
  })
  return NextResponse.json(producto)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.producto.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}

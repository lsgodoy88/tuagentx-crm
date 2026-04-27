import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const movs = await prisma.movInventario.findMany({
    where: { productoId: id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return NextResponse.json(movs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const cantidad = Number(body.cantidad)
  const tipo = body.tipo // entrada | salida

  const producto = await prisma.producto.findUnique({ where: { id } })
  if (!producto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const nuevoStock = tipo === 'entrada' ? producto.stock + cantidad : producto.stock - cantidad
  if (nuevoStock < 0) return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 })

  const [mov] = await prisma.$transaction([
    prisma.movInventario.create({
      data: { productoId: id, tipo, cantidad, motivo: body.motivo || 'Ajuste manual' }
    }),
    prisma.producto.update({ where: { id }, data: { stock: nuevoStock } })
  ])
  return NextResponse.json({ mov, nuevoStock })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getUser(req: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('[inventario/getUser] session:', JSON.stringify(session?.user ?? null))
  if (!session) return null
  const email = (session.user as any).email
  const user = await prisma.panelUser.findUnique({ where: { email } })
  console.log('[inventario/getUser] panelUser found:', user ? `id=${user.id} email=${user.email}` : 'null')
  return user
}

// Generar código único PRD-XXX
async function generarCodigo(ownerId: string) {
  const count = await prisma.producto.count({ where: { ownerId } })
  return `PRD-${String(count + 1).padStart(3, '0')}`
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const productos = await prisma.producto.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(productos)
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const codigo = await generarCodigo(user.id)
  const producto = await prisma.producto.create({
    data: {
      codigo,
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      costo: Number(body.costo) || 0,
      precio: Number(body.precio) || 0,
      stock: Number(body.stock) || 0,
      stockMin: Number(body.stockMin) || 3,
      ownerId: user.id
    }
  })
  // Movimiento inicial
  if (producto.stock > 0) {
    await prisma.movInventario.create({
      data: { productoId: producto.id, tipo: 'entrada', cantidad: producto.stock, motivo: 'Stock inicial' }
    })
  }
  return NextResponse.json(producto)
}

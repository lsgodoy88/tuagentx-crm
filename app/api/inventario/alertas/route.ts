import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ count: 0 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ count: 0 })

  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    select: { stock: true, stockMin: true }
  })
  const count = productos.filter((p: {stock: number, stockMin: number}) => p.stock <= p.stockMin).length
  return NextResponse.json({ count })
}

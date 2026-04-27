import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const instance = req.nextUrl.searchParams.get('instance')
  if (!instance) return NextResponse.json([])

  const bot = await prisma.bot.findFirst({ where: { instance } })
  if (!bot) return NextResponse.json([])

  const productos = await prisma.producto.findMany({
    where: { ownerId: bot.ownerId, activo: true },
    orderBy: { nombre: 'asc' }
  })

  return NextResponse.json(productos)
}

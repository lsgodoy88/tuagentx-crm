import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instance = searchParams.get('instance')
  if (!instance) return NextResponse.json([])

  const bot = await prisma.bot.findFirst({ where: { instance } })
  if (!bot) return NextResponse.json([])

  const servicios = await prisma.servicio.findMany({
    where: { ownerId: bot.ownerId, activo: true },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(servicios)
}

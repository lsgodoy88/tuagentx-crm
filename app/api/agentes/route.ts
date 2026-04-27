import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  const isInternal = internalSecret && authHeader === `Bearer ${internalSecret}`
  const session = await getServerSession(authOptions)
  if (!session && !isInternal) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session?.user as any

  // Filtro por instance si viene en query
  const { searchParams } = new URL(req.url)
  const instance = searchParams.get('instance')
  if (instance) {
    const bot = await prisma.bot.findFirst({ where: { instance } })
    return NextResponse.json(bot ? [bot] : [])
  }

  let ownerId: string | undefined
  if (user?.role === 'empresa') {
    const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
    if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    ownerId = panelUser.id
  }
  const bots = await prisma.bot.findMany({
    where: ownerId ? { ownerId } : {},
    include: { owner: { select: { id: true, name: true, plan: true } } },
    orderBy: [{ ownerId: 'asc' }, { slot: 'asc' }],
  })
  return NextResponse.json(bots)
}

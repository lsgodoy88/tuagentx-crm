import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any

  // Admin puede ver todos, empresa solo los suyos
  let ownerId: string | undefined
  if (user.role === 'empresa') {
    const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
    if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    ownerId = panelUser.id
  }

  const bots = await prisma.bot.findMany({
    where: ownerId ? { ownerId } : {},
    include: { owner: { select: { name: true, plan: true } } },
    orderBy: [{ ownerId: 'asc' }, { slot: 'asc' }],
  })

  return NextResponse.json(bots)
}

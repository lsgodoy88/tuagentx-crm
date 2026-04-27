import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await prisma.bot.findUnique({
    where: { id: (await params).id },
    include: { owner: { select: { name: true, email: true, plan: true } } },
  })

  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })
  return NextResponse.json(bot)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, activo } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (activo !== undefined) data.activo = activo

  const bot = await prisma.bot.update({ where: { id: (await params).id }, data })
  return NextResponse.json(bot)
}

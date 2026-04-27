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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
  const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

  // Cerrar sesión en Evolution
  try {
    await fetch(`${EVO_URL}/instance/logout/${bot.instance}`, {
      method: 'DELETE',
      headers: { 'apikey': EVO_KEY }
    })
  } catch(e) {
    console.log('Error cerrando sesión Evolution:', e)
  }

  return NextResponse.json({ ok: true })
}

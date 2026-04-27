import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const { instanceDestino, intencion, limiteTurnos = 10 } = await req.json()
  if (!instanceDestino || !intencion) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const limite = Math.min(Math.max(parseInt(limiteTurnos) || 10, 3), 20)
  const botDestino = await prisma.bot.findFirst({ where: { instance: instanceDestino } })
  if (!botDestino) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const simId = `${Date.now()}`

  await fetch('http://localhost:3001/simulador', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simId, instanceDestino, intencion, limite })
  })

  return NextResponse.json({ simId })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const numero   = searchParams.get('numero')
  const instancia = searchParams.get('instancia')
  if (!numero || !instancia) return NextResponse.json({ error: 'Faltan params' }, { status: 400 })

  const conv = await prisma.botConversacion.findUnique({
    where: { numero_instancia: { numero, instancia } },
    select: { id: true, estado: true, intencion: true, score: true },
  })
  return NextResponse.json(conv || { estado: 'NUEVO', intencion: null, score: 0 })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { numero, instancia, estado, intencion, score, mensajeUser, mensajeBot } = await req.json()
  if (!numero || !instancia) return NextResponse.json({ error: 'Faltan: numero, instancia' }, { status: 400 })

  const conv = await prisma.botConversacion.upsert({
    where: { numero_instancia: { numero, instancia } },
    update: {
      estado:   estado   ?? undefined,
      intencion: intencion ?? undefined,
      score:    score    ?? undefined,
    },
    create: { numero, instancia, estado: estado || 'NUEVO', intencion, score: score || 0 },
  })

  if (mensajeUser || mensajeBot) {
    const mensajes: any[] = []
    if (mensajeUser) mensajes.push({ conversacionId: conv.id, rol: 'user',      contenido: mensajeUser.contenido, intencion: mensajeUser.intencion || null })
    if (mensajeBot)  mensajes.push({ conversacionId: conv.id, rol: 'assistant', contenido: mensajeBot.contenido,  intencion: mensajeBot.intencion  || null })
    await prisma.botMensaje.createMany({ data: mensajes })
  }

  return NextResponse.json({ ok: true, conversacionId: conv.id, estado: conv.estado })
}

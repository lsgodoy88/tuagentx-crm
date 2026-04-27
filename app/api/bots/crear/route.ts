import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

function generarToken() {
  return [
    Math.random().toString(36).substring(2, 10).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 10).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
  ].join('-')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'empresa') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { slot } = await req.json()
  if (!slot || typeof slot !== 'number') return NextResponse.json({ error: 'slot requerido' }, { status: 400 })

  const existente = await prisma.bot.findFirst({ where: { ownerId: panelUser.id, slot } })
  if (existente) return NextResponse.json({ error: 'El slot ya tiene un bot' }, { status: 409 })

  const instanceName = `${panelUser.name}_bot${slot}`

  try {
    // Evolution: instancia
    const evoToken = generarToken()
    const evoRes = await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_APIKEY },
      body: JSON.stringify({ instanceName, token: evoToken, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
    })
    const evoData = await evoRes.json()
    if (evoData.error) throw new Error(`Evolution: ${evoData.message || evoData.error}`)

    // Configurar webhook
    await fetch(`${EVO_URL}/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_APIKEY },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: 'http://bot:3001/webhook',
          webhook_by_events: false,
          webhook_base64: false,
          events: ['MESSAGES_UPSERT'],
        },
      }),
    }).catch(e => console.error('[bots/crear] webhook config error:', e.message))

    // Carpeta de media
    fs.mkdirSync(`/srv/whatsapp-stack/media/${instanceName}/productos`, { recursive: true })

    // Registro en BD
    const bot = await prisma.bot.create({
      data: {
        name:     `Agente ${slot}`,
        slot,
        ownerId:  panelUser.id,
        instance: instanceName,
        evoToken,
        config:   {},
      },
    })

    // Rebuild best-effort
    execAsync('cd /srv/whatsapp-stack && docker compose up -d --build bot')
      .catch(e => console.error('[bots/crear] rebuild error:', e.message))

    return NextResponse.json({ id: bot.id, instance: bot.instance })
  } catch (err: any) {
    console.error('[bots/crear] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PLAN_BOTS } from '@/lib/planes'
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
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.MASTER_API_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { empresaId, planNuevo } = await req.json()
  if (!empresaId || !planNuevo) {
    return NextResponse.json({ error: 'Faltan campos: empresaId, planNuevo' }, { status: 400 })
  }

  const empresa = await prisma.panelUser.findUnique({
    where: { id: empresaId },
    include: { bots: { orderBy: { slot: 'asc' } } },
  })
  if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const slotsExistentes = empresa.bots.length
  const slotsObjetivo   = PLAN_BOTS[planNuevo] || 1

  if (slotsObjetivo <= slotsExistentes) {
    return NextResponse.json({ ok: true, message: 'No hay slots nuevos que crear', slotsCreados: 0 })
  }

  const empresaNombre = empresa.name
  const nuevosBots: any[] = []

  try {
    for (let slot = slotsExistentes + 1; slot <= slotsObjetivo; slot++) {
      const instanceName = `${empresaNombre}_bot${slot}`

      // Evolution: crear instancia
      const evoToken = generarToken()
      const evoRes = await fetch(`${EVO_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVO_APIKEY },
        body: JSON.stringify({ instanceName, token: evoToken, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      })
      const evoData = await evoRes.json()
      if (evoData.error) throw new Error(`Evolution slot ${slot}: ${evoData.message || evoData.error}`)

      nuevosBots.push({ slot, instanceName, evoToken })
    }

    // Carpetas de media
    for (const bot of nuevosBots) {
      fs.mkdirSync(`/srv/whatsapp-stack/media/${bot.instanceName}/productos`, { recursive: true })
    }

    // Registros en BD
    await prisma.bot.createMany({
      data: nuevosBots.map(b => ({
        name:     `Bot ${b.slot}`,
        slot:     b.slot,
        ownerId:  empresaId,
        instance: b.instanceName,
        evoToken: b.evoToken,
        config:   {},
      })),
    })

    // Rebuild (best-effort)
    execAsync('cd /srv/whatsapp-stack && docker compose up -d --build bot')
      .catch(e => console.error('[upgrade-bots] rebuild error:', e.message))

    console.log(`[upgrade-bots] ${empresaNombre} → ${planNuevo}: ${nuevosBots.length} bot(s) creados`)
    return NextResponse.json({ ok: true, slotsCreados: nuevosBots.length })

  } catch (err: any) {
    console.error('[upgrade-bots] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

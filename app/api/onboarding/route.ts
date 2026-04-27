import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

const EVO_URL   = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!
const BOT_INDEX  = '/srv/whatsapp-stack/bot/index.js'

async function getInstanciaConectada(): Promise<string | null> {
  try {
    const res = await fetch(`${EVO_URL}/instance/fetchInstances`, {
      headers: { apikey: EVO_APIKEY },
    })
    const instances = await res.json()
    if (!Array.isArray(instances)) return null
    const conectada = instances.find((i: any) => i.connectionStatus === 'open')
    if (!conectada) {
      console.log('[onboarding] Sin instancia conectada para notificaciones')
      return null
    }
    return conectada.instance?.instanceName ?? conectada.name ?? null
  } catch (err) {
    console.error('[onboarding] Error consultando instancias Evolution:', err)
    return null
  }
}

const PLANES: Record<string, number> = { basico: 1, pro: 2, business: 3 }

function generarPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generarToken() {
  return [
    Math.random().toString(36).substring(2,10).toUpperCase(),
    Math.random().toString(36).substring(2,6).toUpperCase(),
    Math.random().toString(36).substring(2,10).toUpperCase(),
    Math.random().toString(36).substring(2,6).toUpperCase(),
  ].join('-')
}

export async function POST(req: NextRequest) {
  const isInternal = req.headers.get('x-internal') === 'master'
    && req.headers.get('Authorization') === `Bearer ${process.env.MASTER_API_SECRET}`

  if (!isInternal) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { name, numero, plan, tipoNegocio, planDias } = await req.json()
  if (!name || !numero || !plan) return NextResponse.json({ error: 'Faltan: name, numero, plan' }, { status: 400 })

  const maxBots = PLANES[plan] || 1

  // ── Path interno (webhook): ejecuta sin SSE, retorna JSON + envía WA ──────
  if (isInternal) {
    try {
      const existe = await prisma.panelUser.findFirst({ where: { name } })
      if (existe) return NextResponse.json({ ok: false, error: `Ya existe empresa: ${name}` }, { status: 409 })

      const botsCreados: any[] = []
      for (let slot = 1; slot <= maxBots; slot++) {
        const instanceName = `${name}_bot${slot}`
        const evoToken = generarToken()
        const evoRes = await fetch(`${EVO_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
          body: JSON.stringify({ instanceName, token: evoToken, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
        })
        const evoData = await evoRes.json()
        if (evoData.error) throw new Error(`Evolution slot ${slot}: ${evoData.message || evoData.error}`)
        await fetch(`${EVO_URL}/webhook/set/${encodeURIComponent(instanceName)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: 'http://bot:3001/webhook',
              webhook_by_events: false,
              webhook_base64: false,
              events: ['MESSAGES_UPSERT'],
            },
          }),
        }).catch(e => console.error(`[onboarding] webhook config error slot ${slot}:`, e.message))
        botsCreados.push({ slot, instanceName, evoToken })
      }

      for (const bot of botsCreados) {
        fs.mkdirSync(`/srv/whatsapp-stack/media/${bot.instanceName}/productos`, { recursive: true })
      }

      const password = generarPassword()
      const email = `admin@${name.toLowerCase().replace(/\s+/g, '')}`
      const hash = await bcrypt.hash(password, 10)
      const dias = planDias ?? 30
      const planFinDate = new Date(Date.now() + dias * 86400000)
      await prisma.panelUser.create({
        data: {
          name, email, password: hash,
          instance: `${name}_bot1`,
          role: 'empresa',
          plan,
          planActivo: true,
          planFin: planFinDate,
          tipoNegocio: tipoNegocio || 'productos',
          empresaConfig: { create: { telefono: numero } },
          bots: {
            create: botsCreados.map(b => ({
              name: `Bot ${b.slot}`, slot: b.slot, instance: b.instanceName,
              evoToken: b.evoToken, config: {},
            }))
          }
        }
      })

      execAsync('cd /srv/whatsapp-stack && docker compose up -d --build bot')
        .catch(e => console.error('[onboarding] rebuild error:', e.message))

      const NOTIF = await getInstanciaConectada()
      if (NOTIF && numero) {
        const mensaje = `🎉 ¡Bienvenido a TuAgentX, ${name}!\n\nTu cuenta está lista. Aquí tus credenciales:\n\n🔗 crm.tuagentx.com\n📧 Usuario: ${email}\n🔑 Contraseña: ${password}\n\nPróximos pasos:\n1. Inicia sesión con tus credenciales\n2. Conecta tu agente WhatsApp escaneando el QR\n3. Configura tu agente y empieza a vender 🚀\n\n¿Dudas? Responde este mensaje y te ayudamos.`
        fetch(`${EVO_URL}/message/sendText/${NOTIF}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: EVO_APIKEY },
          body: JSON.stringify({ number: numero, text: mensaje }),
        }).catch(err => console.error('[onboarding] WA send error:', err))
      }

      console.log(`[onboarding] CRM creado: ${email}`)
      return NextResponse.json({ ok: true, data: { email } })
    } catch (err: any) {
      console.error('[onboarding] Error interno:', err.message)
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
  }
  // ── Fin path interno ──────────────────────────────────────────────────────

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(obj: object) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify(obj) + '\n\n'))
      }

      try {
        // PASO 0: Validar nombre
        emit({ type: 'paso', index: 0, estado: 'cargando' })
        const existe = await prisma.panelUser.findFirst({ where: { name } })
        if (existe) throw Object.assign(new Error(`Ya existe una empresa con el nombre "${name}"`), { index: 0 })
        emit({ type: 'paso', index: 0, estado: 'ok' })

        // PASO 1: Base de datos (ahora instantáneo — sin NocoDB)
        emit({ type: 'paso', index: 1, estado: 'cargando' })
        emit({ type: 'paso', index: 1, estado: 'ok' })

        // PASO 2: Canal mensajería (Evolution — todos los bots)
        emit({ type: 'paso', index: 2, estado: 'cargando' })
        const botsCreados: any[] = []
        for (let slot = 1; slot <= maxBots; slot++) {
          const instanceName = `${name}_bot${slot}`
          const evoToken = generarToken()
          const evoRes = await fetch(`${EVO_URL}/instance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
            body: JSON.stringify({ instanceName, token: evoToken, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
          })
          const evoData = await evoRes.json()
          if (evoData.error) throw Object.assign(new Error(`Evolution slot ${slot}: ${evoData.message || evoData.error}`), { index: 2 })
          await fetch(`${EVO_URL}/webhook/set/${encodeURIComponent(instanceName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
            body: JSON.stringify({
              webhook: {
                enabled: true,
                url: 'http://bot:3001/webhook',
                webhook_by_events: false,
                webhook_base64: false,
                events: ['MESSAGES_UPSERT'],
              },
            }),
          }).catch(e => console.error(`[onboarding] webhook config error slot ${slot}:`, e.message))
          botsCreados.push({ slot, instanceName, evoToken })
        }
        emit({ type: 'paso', index: 2, estado: 'ok' })

        // PASO 3: (antes actualizaba index.js — ya no necesario)
        emit({ type: 'paso', index: 3, estado: 'cargando' })
        emit({ type: 'paso', index: 3, estado: 'ok' })

        // PASO 4: Carpetas media
        emit({ type: 'paso', index: 4, estado: 'cargando' })
        for (const bot of botsCreados) {
          fs.mkdirSync(`/srv/whatsapp-stack/media/${bot.instanceName}/productos`, { recursive: true })
        }
        emit({ type: 'paso', index: 4, estado: 'ok' })

        // PASO 5: Crear usuario panel + bots en BD
        emit({ type: 'paso', index: 5, estado: 'cargando' })
        const password = generarPassword()
        const email = `admin@${name.toLowerCase().replace(/\s+/g, '')}`
        const hash = await bcrypt.hash(password, 10)
        await prisma.panelUser.create({
          data: {
            name, email, password: hash,
            instance: `${name}_bot1`,
            role: 'empresa',
            plan,
            tipoNegocio: tipoNegocio || 'productos',
            empresaConfig: {
              create: { telefono: numero }
            },
            bots: {
              create: botsCreados.map(b => ({
                name: `Bot ${b.slot}`,
                slot: b.slot,
                instance: b.instanceName,
                evoToken: b.evoToken,
                config: {},
              }))
            }
          }
        })
        emit({ type: 'paso', index: 5, estado: 'ok' })

        // PASO 6: Rebuild
        emit({ type: 'paso', index: 6, estado: 'cargando' })
        execAsync('cd /srv/whatsapp-stack && docker compose up -d --build bot')
          .catch(e => console.log('Rebuild error:', e.message))
        emit({ type: 'paso', index: 6, estado: 'ok' })

        emit({ type: 'done', email, password })
      } catch (err: any) {
        emit({ type: 'error', index: err.index ?? -1, message: err.message })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

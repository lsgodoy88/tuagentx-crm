import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!
const INSTANCE   = 'TuAgentX_Demo'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE}`, {
    headers: { apikey: EVO_APIKEY }
  })
  const data = await res.json()
  const state = data?.instance?.state || data?.state || 'close'

  const demoBotRow = await prisma.demoBot.findFirst({ where: { instance: INSTANCE } })

  if (state === 'open') {
    const infoRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
      headers: { apikey: EVO_APIKEY }
    })
    const instances = await infoRes.json()
    const inst = Array.isArray(instances) ? instances.find((i:any) => i.name === INSTANCE) : null
    const numero = inst?.ownerJid?.replace('@s.whatsapp.net','') || ''

    const row = await prisma.demoBot.upsert({
      where: { instance: INSTANCE },
      update: { numeroDemo: numero },
      create: { instance: INSTANCE, activo: true, numeroDemo: numero }
    })

    return NextResponse.json({
      conectado: true, numero, state,
      activo: row.activo,
      promptVendedor: row.promptVendedor,
      mensajeDespedida: row.mensajeDespedida,
      tiempoSesion: row.tiempoSesion,
      nombreAgente: row.nombreAgente,
      fotoAgente: row.fotoAgente,
      nombreEmpresa: row.nombreEmpresa,
      personalidad: row.personalidad,
      conocimientoBase: row.conocimientoBase,
      caracteristicas: row.caracteristicas,
      condiciones: row.condiciones,
      numeroEscalado: row.numeroEscalado,
      idioma: row.idioma,
    })
  }

  const qrRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE}`, {
    headers: { apikey: EVO_APIKEY }
  })
  const qrData = await qrRes.json()
  const base64 = qrData?.base64 || qrData?.qrcode?.base64 || null

  return NextResponse.json({
    conectado: false, state, base64,
    activo: demoBotRow?.activo ?? true,
    promptVendedor: demoBotRow?.promptVendedor,
    mensajeDespedida: demoBotRow?.mensajeDespedida,
    tiempoSesion: demoBotRow?.tiempoSesion ?? 120,
    nombreAgente: demoBotRow?.nombreAgente,
    fotoAgente: demoBotRow?.fotoAgente,
    nombreEmpresa: demoBotRow?.nombreEmpresa,
    personalidad: demoBotRow?.personalidad,
    conocimientoBase: demoBotRow?.conocimientoBase,
    caracteristicas: demoBotRow?.caracteristicas,
    condiciones: demoBotRow?.condiciones,
    numeroEscalado: demoBotRow?.numeroEscalado,
    idioma: demoBotRow?.idioma,
  })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // 1. Logout de la instancia existente
  try {
    await fetch(`${EVO_URL}/instance/logout/${INSTANCE}`, {
      method: 'DELETE',
      headers: { apikey: EVO_APIKEY }
    })
  } catch {}

  // 2. Esperar que Evolution procese el logout
  await new Promise(r => setTimeout(r, 1000))

  // 3. Conectar y obtener nuevo QR
  try {
    const qrRes = await fetch(`${EVO_URL}/instance/connect/${INSTANCE}`, {
      headers: { apikey: EVO_APIKEY }
    })
    const qrData = await qrRes.json()
    const base64 = qrData?.base64 || qrData?.qrcode?.base64 || null
    return NextResponse.json({ ok: true, base64 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo generar QR' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { activo, promptVendedor, mensajeDespedida, tiempoSesion, nombreAgente, fotoAgente, nombreEmpresa, personalidad, conocimientoBase, caracteristicas, condiciones, numeroEscalado, idioma } = body
  const updateData: any = {}
  if (activo !== undefined) updateData.activo = activo
  if (promptVendedor !== undefined) updateData.promptVendedor = promptVendedor
  if (mensajeDespedida !== undefined) updateData.mensajeDespedida = mensajeDespedida
  if (tiempoSesion !== undefined) updateData.tiempoSesion = tiempoSesion
  if (nombreAgente !== undefined) updateData.nombreAgente = nombreAgente
  if (fotoAgente !== undefined) updateData.fotoAgente = fotoAgente
  if (nombreEmpresa !== undefined) updateData.nombreEmpresa = nombreEmpresa
  if (personalidad !== undefined) updateData.personalidad = personalidad
  if (conocimientoBase !== undefined) updateData.conocimientoBase = conocimientoBase
  if (caracteristicas !== undefined) updateData.caracteristicas = caracteristicas
  if (condiciones !== undefined) updateData.condiciones = condiciones
  if (numeroEscalado !== undefined) updateData.numeroEscalado = numeroEscalado
  if (idioma !== undefined) updateData.idioma = idioma
  const row = await prisma.demoBot.upsert({
    where: { instance: INSTANCE },
    update: updateData,
    create: { instance: INSTANCE, activo: true, ...updateData }
  })
  return NextResponse.json({ ok: true, activo: row.activo })
}

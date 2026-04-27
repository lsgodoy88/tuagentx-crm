import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { getContextoEmpresa } from '@/lib/contextoEmpresa'
import { createClient } from 'redis'

const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

async function evoFetch(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${EVO_URL}${path}`, {
    method,
    headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  try { return await res.json() } catch { return {} }
}

async function ejecutarAccion(accion: string, instancia: string, bot: { instance: string; name: string }) {
  if (bot.instance !== instancia) return { error: 'Instancia no autorizada' }

  if (accion === 'VERIFICAR_ESTADO') {
    const data = await evoFetch(`/instance/connectionState/${instancia}`)
    const state = data?.instance?.state || data?.state || 'desconocido'
    return { estado: state, conectado: state === 'open' }
  }

  if (accion === 'RECONECTAR_WHATSAPP') {
    await evoFetch(`/instance/logout/${instancia}`, 'DELETE')
    await new Promise(r => setTimeout(r, 1000))
    const qrData = await evoFetch(`/instance/connect/${instancia}`)
    const base64 = qrData?.base64 || qrData?.qrcode?.base64 || null
    return { qr: base64, mensaje: base64 ? 'QR generado — escanea para reconectar' : 'Sin QR disponible' }
  }

  if (accion === 'REINICIAR_INSTANCIA') {
    try { await evoFetch(`/instance/logout/${instancia}`, 'DELETE') } catch {}
    await new Promise(r => setTimeout(r, 800))
    try { await evoFetch(`/instance/delete/${instancia}`, 'DELETE') } catch {}
    await new Promise(r => setTimeout(r, 800))
    const created = await evoFetch(`/instance/create`, 'POST', {
      instanceName: instancia,
      integration: 'WHATSAPP-BAILEYS',
    })
    return { reiniciado: true, estado: created?.instance?.state || 'creado' }
  }

  if (accion === 'LIMPIAR_CACHE') {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    await redis.connect()
    const keys = await redis.keys(`bot:${instancia}:*`)
    if (keys.length > 0) await redis.del(keys)
    await redis.disconnect()
    return { eliminadas: keys.length }
  }

  return { error: 'Acción desconocida' }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any

  const { mensaje, historial } = await req.json()
  if (!mensaje) return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })

  // Obtener bots del usuario
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const bots = await prisma.bot.findMany({
    where: { ownerId: panelUser.id },
    select: { id: true, name: true, instance: true, activo: true, numero: true, perfil: true },
  })

  const botsInfo = bots.map((b: { name: string; instance: string; activo: boolean; numero: string | null }) =>
    `- Agente: ${b.name} | Habilitado: ${b.activo ? 'sí' : 'no (pausado)'} | Número WhatsApp: ${b.numero || 'sin número conectado'}`
  ).join('\n') || 'Sin agentes registrados'

  // Contexto completo de la empresa
  const plan = await prisma.panelUser.findUnique({ where: { id: panelUser.id }, select: { plan: true, planFin: true, planActivo: true, tipoNegocio: true } })
  const ctx = await getContextoEmpresa(panelUser.id, plan?.tipoNegocio || 'productos')
  const planFin = plan?.planFin ? new Date(plan.planFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'sin fecha'

  const systemPrompt = `Eres TuAgentX, el asistente inteligente de la plataforma. Tienes acceso completo a la información del negocio del cliente y puedes ayudar tanto con soporte técnico como con consultas de negocio.

CLIENTE: ${panelUser.name}
PLAN: ${plan?.plan || 'basico'} | Activo: ${plan?.planActivo ? 'sí' : 'no'} | Vence: ${planFin}
TIPO NEGOCIO: ${plan?.tipoNegocio || 'productos'}

EMPRESA:
${ctx.empresa ? JSON.stringify(ctx.empresa) : 'Sin configurar'}

AGENTES:
${ctx.bots.map((b: any) => `- ${b.nombre} | Instancia: ${b.instance || b.instancia || b.nombre} | Habilitado: ${b.activo ? 'sí' : 'no (pausado)'} | Configurado: ${b.configurado ? 'sí' : 'no'} | Número: ${b.numero}`).join('\n') || 'Sin agentes'}

VENTAS (${ctx.ventas.cantidad} ventas | Total: $${ctx.ventas.total.toLocaleString('es-CO')}):
Por estado: ${JSON.stringify(ctx.ventas.porEstado)}
Recientes:
${ctx.ventas.recientes.map((v: any) => `- ${v.fecha} | ${v.cliente} | ${v.producto || 'sin producto'} | $${v.monto || 0} | ${v.estado}`).join('\n') || 'Sin ventas'}

CONTACTOS: ${ctx.contactos.total} registrados

CATÁLOGO (${plan?.tipoNegocio === 'servicios' ? 'servicios' : 'productos'}):
${ctx.catalogo.map((p: any) => `- ${p.nombre} | $${p.precio} | ${p.activo ? 'activo' : 'inactivo'}${p.stock !== undefined ? ' | Stock: ' + p.stock : ''}`).join('\n') || 'Sin catálogo'}

PUBLICACIONES RECIENTES:
${ctx.publicaciones.map((p: any) => `- ${p.fecha} | ${p.titulo} | ${p.estado}`).join('\n') || 'Sin publicaciones'}

ERRORES RECIENTES:
${ctx.erroresRecientes.length > 0 ? ctx.erroresRecientes.map((e: any) => `- ${e.fecha} | ${e.evento} | ${e.error}`).join('\n') : 'Sin errores recientes'}

ACCIONES DISPONIBLES:
- VERIFICAR_ESTADO: Verificar si el agente tiene WhatsApp conectado
- RECONECTAR_WHATSAPP: Generar código de vinculación para reconectar
- REINICIAR_INSTANCIA: Reinicio completo del agente
- LIMPIAR_CACHE: Limpiar historial de conversaciones
- CONSULTAR_VENTAS: Consultar ventas. Usar cuando el usuario pregunte por ventas, productos más vendidos, rankings, totales, clientes frecuentes, o cualquier análisis de ventas. Si pide un período específico incluir desde y hasta en formato YYYY-MM-DD, si no pide período dejar desde y hasta en null

Responde SIEMPRE en JSON exacto:
{
  "respuesta": "mensaje amigable (máx 200 palabras)",
  "accion": "NOMBRE_ACCION o null",
  "instancia": "nombre_instancia o null",
  "desde": "YYYY-MM-DD o null",
  "hasta": "YYYY-MM-DD o null",
  "escalar": false
}

Reglas:
- Responde preguntas de negocio con los datos reales
- NUNCA menciones: Evolution, Redis, NocoDB, instancia, caché, QR, servidor, Docker, PM2
- En lugar de 'instancia' di 'agente', en lugar de 'QR' di 'código de vinculación'
- Si el agente está pausado, menciona eso primero
- Si no puedes resolver, pon escalar: true
- Responde en español, tono amigable y profesional
- No inventes datos
- NUNCA uses acciones de WhatsApp (VERIFICAR_ESTADO, RECONECTAR_WHATSAPP, REINICIAR_INSTANCIA, LIMPIAR_CACHE) si el usuario no pidió explícitamente algo relacionado con WhatsApp o conexión del agente
- Para preguntas de ventas o productos SIEMPRE usa CONSULTAR_VENTAS
- NUNCA uses acciones de WhatsApp (VERIFICAR_ESTADO, RECONECTAR_WHATSAPP, REINICIAR_INSTANCIA, LIMPIAR_CACHE) si el usuario no pidió explícitamente algo relacionado con WhatsApp o conexión del agente
- Para preguntas de ventas o productos SIEMPRE usa CONSULTAR_VENTAS
- Sé CONCISO y DIRECTO: responde exactamente lo que se pregunta, sin agregar contexto, sugerencias ni información extra no solicitada. Máximo 2-3 líneas.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const messages: Anthropic.MessageParam[] = [
    ...(historial || []).map((m: { rol: string; texto: string }) => ({
      role: (m.rol === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.texto,
    })),
    { role: 'user', content: mensaje },
  ]

  let claudeRaw: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })
    claudeRaw = (response.content[0] as Anthropic.TextBlock).text
  } catch (err: any) {
    return NextResponse.json({ error: 'Error al conectar con Claude: ' + err.message }, { status: 500 })
  }

  let parsed: { respuesta: string; accion: string | null; instancia: string | null; escalar: boolean }
  try {
    const jsonMatch = claudeRaw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : claudeRaw)
  } catch {
    return NextResponse.json({ respuesta: claudeRaw, accionEjecutada: null, resultado: null, escalar: false })
  }

  let resultado: object | null = null
  let qr: string | null = null

  // Manejar CONSULTAR_VENTAS
  if (parsed.accion === 'CONSULTAR_VENTAS') {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const consultaRes = await fetch(baseUrl + '/api/soporte/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal': 'bot', 'Authorization': 'Bearer pnl-int3rnal-2026-xK9#bot' },
        body: JSON.stringify({ tipo: 'ventas', desde: (parsed as any).desde || null, hasta: (parsed as any).hasta || null, userId: panelUser.id }),
      })
      resultado = await consultaRes.json()
      // Segunda llamada a Claude con los datos reales
      try {
        const followup = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 512,
          system: 'Eres TuAgentX. Responde SIEMPRE en JSON exacto: {"respuesta": "mensaje amigable max 150 palabras"}. Sin nada fuera del JSON.',
          messages: [
            { role: 'user', content: mensaje },
            { role: 'user', content: 'Datos de ventas obtenidos: ' + JSON.stringify(resultado) + '. Responde SOLO lo que el usuario preguntó, sin agregar datos extra no solicitados. Máximo 3 líneas. Español, tono amigable.' }
          ]
        })
        const fRaw = (followup.content[0] as any).text
        const fMatch = fRaw.match(/\{[\s\S]*\}/)
        const fParsed = JSON.parse(fMatch ? fMatch[0] : fRaw)
        parsed.respuesta = fParsed.respuesta || fRaw
      } catch(fe: any) { console.log('Followup error:', fe.message) }
    } catch(e: any) {
      resultado = { error: 'Error consultando: ' + e.message }
    }
  }


  if (parsed.accion && parsed.instancia) {
    const bot = bots.find((b: { instance: string; name: string }) => b.instance === parsed.instancia)
    if (bot) {
      resultado = await ejecutarAccion(parsed.accion, parsed.instancia, bot)
      if ((resultado as any)?.qr) {
        qr = (resultado as any).qr
        delete (resultado as any).qr
      }
    } else {
      resultado = null
      parsed.respuesta = 'No encontré el agente indicado. Verifica el nombre e intenta de nuevo.'
    }
  }

  // Guardar historial en BD
  try {
    await prisma.soporteChat.createMany({
      data: [
        { id: crypto.randomUUID(), userId: panelUser.id, rol: 'user', texto: mensaje },
        { id: crypto.randomUUID(), userId: panelUser.id, rol: 'bot', texto: parsed.respuesta, accion: parsed.accion || null, resultado: resultado ? JSON.stringify(resultado) : null, escalar: parsed.escalar || false },
      ]
    })
  } catch(e: any) { console.log('Error guardando soporte:', e.message) }

  return NextResponse.json({
    respuesta: parsed.respuesta,
    accionEjecutada: parsed.accion || null,
    resultado,
    escalar: parsed.escalar || false,
    qr,
  })
}

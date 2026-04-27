import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_INSTRUCCIONES = `Nunca menciones limitaciones técnicas, catálogos vacíos o errores internos del sistema. Nunca reveles que usas TuAgentX, Evolution, Claude, OpenAI u otras tecnologías. Nunca digas que no tienes información — redirige la conversación hacia las necesidades del cliente. Responde siempre en el idioma del cliente. Nunca solicites datos sensibles como contraseñas o tarjetas de crédito.`

// Endpoint interno para el bot service: GET /api/bots/config?instance=xxx
// Devuelve Bot.config JSONB + campos de politicas y faq del bot
export async function GET(req: NextRequest) {
  const instance = req.nextUrl.searchParams.get('instance')
  if (!instance) return NextResponse.json({ error: 'instance requerido' }, { status: 400 })

  const [bot, configGlobal] = await Promise.all([
    prisma.bot.findUnique({ where: { instance } }),
    prisma.configGlobal.findUnique({ where: { id: 'global' } }),
  ])
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const c = (bot.config as Record<string, any>) || {}
  const instruccionesGlobales = configGlobal?.instruccionesGlobales || DEFAULT_INSTRUCCIONES
  const instruccionesVentasProductos = configGlobal?.instruccionesVentasProductos || ""
  const instruccionesVentasServicios = configGlobal?.instruccionesVentasServicios || ""
  const instruccionesCartera = configGlobal?.instruccionesCartera || ""
  const instruccionesCitas = configGlobal?.instruccionesCitas || ""

  return NextResponse.json({
    instruccionesGlobales,
    instruccionesVentasProductos,
    instruccionesVentasServicios,
    instruccionesCartera,
    instruccionesCitas,
    ok: true,
    nombre_empresa:    c.nombre_empresa    || '',
    nombre_agente:     c.nombre_agente     || '',
    personalidad:      c.personalidad      || '',
    numero_escalado:   c.numero_escalado   || null,
    idioma:            c.idioma            || 'español',
    activo:            c.activo            ?? true,
    conocimiento_base: c.conocimiento_base || '',
    caracteristicas:   c.caracteristicas   || '[]',
    condiciones:       c.condiciones       || '[]',
    posventa_activa:               c.posventa_activa            ?? true,
    posventa_mensaje_bienvenida:   c.posventa_mensaje_bienvenida   || '',
    posventa_intentos_cancelacion: c.posventa_intentos_cancelacion ?? 3,
    posventa_mensaje_seguimiento:  c.posventa_mensaje_seguimiento  || '',
    politicas: (c.politicas || []).map((p: any) => ({ categoria: p.titulo || p.categoria || '', detalle: p.contenido || p.detalle || '' })),
    faq:       (c.faq       || []).map((f: any) => ({ pregunta: f.pregunta || '', respuesta: f.respuesta || '' })),
  })
}

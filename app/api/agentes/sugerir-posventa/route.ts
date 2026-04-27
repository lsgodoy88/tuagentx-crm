import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any

  const { botId, nombre_empresa, nombre_agente, personalidad, tipo_negocio, caracteristicas, condiciones, tipoAgente } = await req.json()

  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    take: 10,
    orderBy: { nombre: 'asc' },
    select: { nombre: true, precio: true },
  })

  const productosList = productos.length > 0
    ? productos.map((p: any) => `- ${p.nombre}${p.precio ? ` ($${p.precio})` : ''}`).join('\n')
    : 'Sin productos registrados'

  const base = `Empresa: ${nombre_empresa || 'No especificada'}
Agente: ${nombre_agente || 'No especificado'}
Personalidad: ${personalidad || 'No especificada'}
Tipo negocio: ${tipo_negocio || 'productos'}
Características: ${caracteristicas || 'No especificadas'}
Productos top:
${productosList}`

  let prompt: string

  if (tipoAgente === 'cartera') {
    prompt = `Eres un experto en cobranza y gestión de cartera. Basándote en esta información:
${base}

Genera mensajes de seguimiento de cobro en JSON puro sin markdown:
{
  "mensaje_bienvenida": "mensaje de recordatorio de pago usando {nombre} y {valor}, empático pero firme, máximo 2 líneas, 1-2 emojis",
  "mensaje_seguimiento": "mensaje de agradecimiento al recibir el pago usando {nombre}, cálido y positivo, máximo 2 líneas, 1 emoji",
  "intentos": 3
}`
  } else if (tipoAgente === 'citas') {
    prompt = `Eres un experto en gestión de agendas y citas. Basándote en esta información:
${base}

Genera mensajes de gestión de citas en JSON puro sin markdown:
{
  "mensaje_bienvenida": "mensaje de confirmación de cita usando {nombre} y {fecha}, cordial y claro, máximo 2 líneas, 1-2 emojis",
  "mensaje_seguimiento": "mensaje para ofrecer reagendamiento cuando cancela, flexible y amable, máximo 2 líneas, 1 emoji",
  "intentos": 24
}`
  } else {
    prompt = `Eres un experto en atención al cliente. Basándote en esta información:
${base}

Genera mensajes de posventa en JSON puro sin markdown:
{
  "mensaje_bienvenida": "mensaje cálido usando {nombre} y {producto}, máximo 2 líneas, 1-2 emojis",
  "mensaje_seguimiento": "mensaje post-entrega usando {nombre}, máximo 2 líneas, 1 emoji",
  "intentos": 3
}`
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find(b => b.type === 'text')?.text || ''

  try {
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'No se pudo parsear la respuesta de IA', raw: text }, { status: 500 })
  }
}

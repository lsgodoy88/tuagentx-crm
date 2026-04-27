import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ cached: false })

  const cache = await (prisma as any).crecerCache.findUnique({ where: { ownerId: panelUser.id } })
  if (!cache) return NextResponse.json({ cached: false })

  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const vigente = new Date(cache.createdAt) > hace7dias

  return NextResponse.json({
    cached: vigente,
    data: JSON.parse(cache.data),
    generadoEl: cache.createdAt,
    expiraEn: new Date(new Date(cache.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000)
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    select: { nombre: true, descripcion: true, precio: true, stock: true }
  })

  const listaProductos = productos.map((p: any) => p.nombre).join(', ')

  const prompt = `Eres un experto en comercio mayorista y tendencias de mercado en Colombia 2026.

Un negocio colombiano que vende por WhatsApp tiene estos productos en su inventario:
${listaProductos}

Tu tarea:
1. Detecta el nicho de negocio (máximo 5 palabras)
2. Busca en internet las tendencias actuales de ese nicho en Colombia 2026
3. Recomienda EXACTAMENTE 3 productos estrella de alta rotación para ese nicho en Colombia

Para cada producto devuelve un JSON con esta estructura exacta:
{
  "nicho": "cuidado capilar y belleza",
  "tendencia_general": "descripción de qué está pasando en ese nicho en Colombia ahora",
  "productos": [
    {
      "nombre": "nombre del producto",
      "descripcion": "qué es y para qué sirve en 2 líneas",
      "por_que_vende": "razón concreta por la que está en tendencia en Colombia ahora",
      "precio_mayorista_min": 15000,
      "precio_mayorista_max": 25000,
      "precio_venta_sugerido": 45000,
      "proveedor_nombre": "nombre real del proveedor o mercado mayorista en Colombia",
      "proveedor_ciudad": "ciudad en Colombia",
      "proveedor_contacto": "sitio web o dirección física si la encuentras"
    }
  ]
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown, sin explicaciones.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      messages: [{ role: 'user', content: prompt }]
    })

    let texto = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')

    if (!texto) {
      const r2 = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
      texto = (r2.content[0] as any).text
    }

    // Extraer JSON del texto
    texto = texto.replace(/```json|```/g, '').trim()
    // Buscar el JSON en el texto si hay texto adicional
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const json = JSON.parse(jsonMatch[0])

    // Guardar en caché
    await (prisma as any).crecerCache.upsert({
      where: { ownerId: panelUser.id },
      update: { data: JSON.stringify(json), createdAt: new Date() },
      create: { ownerId: panelUser.id, data: JSON.stringify(json) }
    })

    return NextResponse.json(json)
  } catch (e: any) {
    console.error('Crecer API error:', e)
    return NextResponse.json({ error: 'Error al generar recomendaciones' }, { status: 500 })
  }
}

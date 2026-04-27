import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ cached: false })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ cached: false })

  const cache = await (prisma as any).inventarioAnalisis.findUnique({ where: { ownerId: panelUser.id } })
  if (!cache) return NextResponse.json({ cached: false })

  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const vigente = new Date(cache.createdAt) > hace7dias

  return NextResponse.json({ cached: vigente, data: JSON.parse(cache.data), generadoEl: cache.createdAt })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Productos con movimientos de salida (ventas)
  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    include: {
      movimientos: {
        where: { tipo: 'salida' },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  // Calcular métricas por producto
  const datos = productos.map((p: any) => {
    const totalVendido = p.movimientos.reduce((a: number, m: any) => a + m.cantidad, 0)
    
    // Ventas últimos 30 días
    const hace30 = new Date()
    hace30.setDate(hace30.getDate() - 30)
    const vendido30 = p.movimientos
      .filter((m: any) => new Date(m.createdAt) > hace30)
      .reduce((a: number, m: any) => a + m.cantidad, 0)

    // Ventas últimos 7 días
    const hace7 = new Date()
    hace7.setDate(hace7.getDate() - 7)
    const vendido7 = p.movimientos
      .filter((m: any) => new Date(m.createdAt) > hace7)
      .reduce((a: number, m: any) => a + m.cantidad, 0)

    // Días de stock restante
    const ventaDiaria = vendido30 / 30
    const diasStock = ventaDiaria > 0 ? Math.round(p.stock / ventaDiaria) : 999

    return {
      nombre: p.nombre,
      stock: p.stock,
      stockMin: p.stockMin,
      totalVendido,
      vendido30dias: vendido30,
      vendido7dias: vendido7,
      ventaDiariaPromedio: Math.round(ventaDiaria * 10) / 10,
      diasStockRestante: diasStock,
      estadoStock: p.stock <= 0 ? 'agotado' : p.stock <= p.stockMin ? 'critico' : 'ok'
    }
  })

  const prompt = `Eres un experto en gestión de inventario para negocios en Colombia.

Analiza este inventario y sus ventas históricas:

${datos.map((p: any) => `- ${p.nombre}: stock ${p.stock} uds, mínimo ${p.stockMin}, vendido últimos 30 días: ${p.vendido30dias} uds, últimos 7 días: ${p.vendido7dias} uds, promedio diario: ${p.ventaDiariaPromedio} uds/día, días de stock restante: ${p.diasStockRestante === 999 ? 'sin ventas' : p.diasStockRestante + ' días'}, estado: ${p.estadoStock}`).join('\n')}

Genera un análisis con esta estructura JSON exacta:
{
  "resumen": "diagnóstico general del inventario en 2 líneas",
  "alertas": [
    { "producto": "nombre", "nivel": "critico|advertencia|ok", "mensaje": "qué pasa con este producto" }
  ],
  "reabastecimiento": [
    { "producto": "nombre", "unidadesActuales": 0, "unidadesSugeridas": 0, "razon": "por qué pedir esta cantidad" }
  ],
  "productos_lentos": ["producto1", "producto2"],
  "productos_estrella": ["producto1", "producto2"]
}

Solo incluye en reabastecimiento los productos que realmente necesiten reabastecerse (stock crítico o agotado o menos de 2 semanas de stock).
Responde ÚNICAMENTE con el JSON válido, sin texto adicional.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
    let texto = (response.content[0] as any).text
    texto = texto.replace(/```json|```/g, '').trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const json = JSON.parse(jsonMatch[0])
    await (prisma as any).inventarioAnalisis.upsert({
      where: { ownerId: panelUser.id },
      update: { data: JSON.stringify({ ...json, datos }), createdAt: new Date() },
      create: { ownerId: panelUser.id, data: JSON.stringify({ ...json, datos }) }
    })
    return NextResponse.json({ ...json, datos })
  } catch (e: any) {
    console.error('Inventario analisis error:', e)
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 })
  }
}

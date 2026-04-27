import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { finanzas } = await req.json()

  const prompt = `Eres un experto en estrategia comercial para negocios en Colombia que venden por WhatsApp.

Analiza estos datos financieros:
- Ingresos: $${finanzas.resumen.ingresos.toLocaleString('es-CO')}
- Costo ventas: $${finanzas.resumen.costoVentas.toLocaleString('es-CO')}
- Fletes: $${finanzas.resumen.totalFletes.toLocaleString('es-CO')}
- Ganancia bruta: $${finanzas.resumen.gananciaBruta.toLocaleString('es-CO')}
- Margen general: ${finanzas.resumen.margenGeneral}%
- Total ventas: ${finanzas.resumen.totalVentas}
- Valor inventario: $${finanzas.valorInventario.toLocaleString('es-CO')}

Top productos rentables:
${finanzas.topProductos.map((p: any) => `- ${p.nombre}: ${p.unidades} uds, margen ${p.margen}%`).join('\n')}

Productos bajo margen:
${finanzas.productosBajoMargen.slice(0,5).map((p: any) => `- ${p.nombre}: margen ${p.margen}%`).join('\n')}

Responde con:
1. **💊 Diagnóstico** — salud financiera en 2-3 líneas
2. **🌟 Potenciar** — qué productos impulsar
3. **⚠️ Revisar** — qué productos tienen margen insostenible
4. **🎯 3 acciones concretas** — para los próximos 30 días

Sé directo y práctico. Usa emojis.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
    const texto = (response.content[0] as any).text
    return NextResponse.json({ analisis: texto })
  } catch (e: any) {
    return NextResponse.json({ error: 'Error IA' }, { status: 500 })
  }
}

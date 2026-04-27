import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { base64, mediaType, nombreEmpresa } = await req.json()
  if (!base64) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })

  // Si es Excel, parsearlo directamente sin IA
  if (mediaType?.includes('spreadsheet') || mediaType?.includes('excel')) {
    try {
      const XLSX = await import('xlsx' as any).catch(() => null)
      if (!XLSX) throw new Error('xlsx no disponible')
      const buf = Buffer.from(base64, 'base64')
      const wb = XLSX.read(buf, { type: 'buffer' })

      const getSheet = (name: string) => {
        const ws = wb.Sheets[name]
        if (!ws) return []
        return XLSX.utils.sheet_to_json(ws, { defval: '' })
      }

      const configRows: any[] = getSheet('Configuracion')
      const catalogoRows: any[] = getSheet('Catalogo')
      const politicasRows: any[] = getSheet('Politicas')
      const faqRows: any[]      = getSheet('FAQ')

      // Config: cada fila tiene Campo y Valor
      const config: any = {}
      for (const row of configRows) {
        const campo = (row['Campo'] || row['campo'] || '').toString().trim()
        const valor = (row['Valor'] || row['valor'] || '').toString().trim()
        if (campo && valor) config[campo] = valor
      }

      return NextResponse.json({
        ok: true,
        data: {
          nombre_empresa:  config.nombre_empresa  || nombreEmpresa,
          nombre_agente:   config.nombre_agente   || '',
          personalidad:    config.personalidad    || '',
          idioma:          config.idioma          || 'español',
          catalogo:  catalogoRows.map((r: any) => ({ nombre: r.nombre||'', descripcion: r.descripcion||'', precio: r.precio||'', imagen: r.imagen||'', disponible: r.disponible||'si' })),
          politicas: politicasRows.map((r: any) => ({ titulo: r.titulo||'', contenido: r.contenido||'' })),
          faq:       faqRows.map((r: any) => ({ pregunta: r.pregunta||'', respuesta: r.respuesta||'' })),
        }
      })
    } catch (err: any) {
      return NextResponse.json({ error: 'Error leyendo Excel: ' + err.message }, { status: 500 })
    }
  }

  const prompt = `Eres un asistente experto en configurar bots de ventas para WhatsApp.

Analiza este documento (catálogo, lista de precios, brochure o imagen de productos) de la empresa "${nombreEmpresa}" y extrae toda la información posible.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "nombre_empresa": "nombre detectado o ${nombreEmpresa}",
  "nombre_agente": "nombre sugerido para el agente ej: Sofia, Carlos",
  "personalidad": "prompt completo para el agente, con tono, instrucciones de venta, flujo de conversación, basado en el tipo de negocio detectado",
  "idioma": "español",
  "catalogo": [
    {"nombre": "producto", "descripcion": "descripción detallada", "precio": "precio con moneda", "imagen": "", "disponible": "si"}
  ],
  "politicas": [
    {"titulo": "Envíos", "contenido": "política detectada o sugerida"},
    {"titulo": "Devoluciones", "contenido": "política detectada o sugerida"},
    {"titulo": "Pagos", "contenido": "política detectada o sugerida"}
  ],
  "faq": [
    {"pregunta": "¿pregunta frecuente?", "respuesta": "respuesta completa"},
    {"pregunta": "¿pregunta frecuente?", "respuesta": "respuesta completa"},
    {"pregunta": "¿pregunta frecuente?", "respuesta": "respuesta completa"}
  ]
}`

  try {
    const isPdf = mediaType === 'application/pdf'

    const content: any[] = [
      {
        type: isPdf ? 'document' : 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        }
      },
      { type: 'text', text: prompt }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ ok: true, data: parsed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

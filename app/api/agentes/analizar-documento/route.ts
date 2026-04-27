import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const TIPO_LABELS: Record<string, string> = {
  ventas:   'agente de ventas',
  soporte:  'agente de soporte técnico',
  atencion: 'agente de atención al cliente',
  manual:   'asesor técnico con base documental',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { textoDocumento, nombreAgente, nombreEmpresa, personalidadTipo } = await req.json()

  if (!textoDocumento) return NextResponse.json({ error: 'No hay texto de documento' }, { status: 400 })

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const tipoLabel = TIPO_LABELS[personalidadTipo] || 'agente de atención'
    const agente  = nombreAgente  || 'el agente'
    const empresa = nombreEmpresa || 'la empresa'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analiza este documento y genera un perfil de conocimiento para un agente de WhatsApp. NO listes productos ni precios específicos. En cambio, extrae:

1. A qué se dedica la empresa (categoría, nicho, especialidad)
2. Qué tipo de productos o servicios maneja (características generales, materiales, beneficios, presentaciones)
3. El tono y valores de la marca (si se detectan)
4. Términos técnicos o especializados del sector que el agente debe conocer
5. Cualquier diferenciador o propuesta de valor clara

El objetivo es que el agente entienda el negocio en profundidad para hablar con propiedad, no que memorice un catálogo. Máximo 800 palabras. Escribe en español, tono natural.

DOCUMENTO:
${textoDocumento.substring(0, 2000)}`,
      }],
    })

    const texto = (message.content[0] as any).text?.trim() || ''
    return NextResponse.json({ texto })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

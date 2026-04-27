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

  const { nombreEmpresa, personalidad, personalidadTipo } = await req.json()

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const tipoLabel = TIPO_LABELS[personalidadTipo] || 'agente de atención'
    const empresa = nombreEmpresa || 'la empresa'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un experto en configuración de agentes IA para negocios latinoamericanos.
Genera una base de conocimiento detallada para un ${tipoLabel} de la empresa "${empresa}".

Rol configurado: ${personalidad ? personalidad.substring(0, 300) : 'estándar'}

La base de conocimiento debe cubrir de forma concisa:
- Descripción del negocio y propuesta de valor
- Productos o servicios principales (ejemplos realistas con precios aproximados)
- Políticas clave: envíos, devoluciones, garantías según el tipo de negocio
- 5 preguntas frecuentes con sus respuestas
- Horarios de atención y canales de contacto

Escribe en español, tono profesional pero cercano, sin encabezados markdown, en párrafos fluidos. Máximo 500 palabras.`,
      }],
    })

    const texto = (message.content[0] as any).text?.trim() || ''
    return NextResponse.json({ texto })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

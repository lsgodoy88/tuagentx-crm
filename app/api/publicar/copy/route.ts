import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { producto, precio, descripcion, tono, canales } = await req.json()

  const esMulticanal = canales?.includes('instagram') || canales?.includes('facebook')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Eres experto en marketing digital para negocios en Colombia. Crea un copy llamativo para promocionar este producto:

Producto: ${producto}
Precio: ${precio || 'no especificado'}
Descripción: ${descripcion || 'sin descripción'}
Tono: ${tono || 'promocional y amigable'}
Canales: ${canales?.join(', ') || 'WhatsApp'}

${esMulticanal
  ? 'Genera un copy adaptado para redes sociales (máximo 200 caracteres), con emojis y llamado a la acción.'
  : 'Genera un copy corto para estado de WhatsApp (máximo 150 caracteres), con 1-2 emojis.'}

Responde SOLO con el texto, sin comillas ni explicaciones.`
    }]
  })

  const copy = (response.content[0] as any).text.trim()
  return NextResponse.json({ copy })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({
    where: { email: user.email },
    include: { bots: true }
  })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('imagen') as File
  if (!file) return NextResponse.json({ error: 'No imagen' }, { status: 400 })

  const instancia = panelUser.bots[0]?.instance || 'media'
  const dir = '/srv/whatsapp-stack/media/' + instancia
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })

  const imgName = 'pub_' + Date.now() + '.jpg'
  const imgPath = path.join(dir, imgName)
  const bytes = await file.arrayBuffer()
  await writeFile(imgPath, Buffer.from(bytes))
  const imgUrl = 'https://panel.tuagentx.com/media/' + instancia + '/' + imgName

  // Sugerir caption con IA
  let caption = ''
  try {
    const base64 = Buffer.from(bytes).toString('base64')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Eres un experto en marketing para redes sociales. Analiza esta imagen y escribe un caption atractivo y corto (máximo 2 líneas) en español para publicar como estado de WhatsApp. Solo responde con el caption, sin explicaciones.' }
          ]
        }]
      })
    })
    clearTimeout(timeout)
    const aiData = await aiRes.json()
    caption = aiData.content?.[0]?.text || ''
  } catch(e) {
    console.error('[publicar] Error IA caption:', e)
  }

  return NextResponse.json({ ok: true, imgUrl, imgPath, imgName, caption })
}

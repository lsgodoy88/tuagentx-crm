import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const rateMap = new Map<string, { count: number; reset: number }>()

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, 'ia')
  if (!rl.ok) return NextResponse.json(
    { error: 'Demasiadas solicitudes — intenta en un momento' },
    { status: 429, headers: rateLimitHeaders(rl) }
  )
  const ip = getIP(req)
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Maximo 5MB.' }, { status: 400 })
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Solo JPG PNG WEBP o PDF.' }, { status: 400 })
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const isPdf = file.type === 'application/pdf'
    const content: any[] = [
      isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: file.type as any, data: base64 } },
      { type: 'text', text: 'Analiza este archivo y extrae info de UN producto.\nResponde SOLO con JSON valido sin markdown:\n{"producto":"","marca":"","precio":"solo numeros","talla":"","descripcion":"max 100 chars"}\nSi no encuentras un campo dejalo vacio. Solo el JSON.' }
    ]
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content }]
    })
    const txt = (response.content.find((b: any) => b.type === 'text') as any)?.text || ''
    const clean = txt.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    const s = (v: any) => String(v || '').slice(0, 200).replace(/[<>]/g, '')
    return NextResponse.json({ ok: true, data: {
      producto: s(data.producto),
      marca: s(data.marca),
      precio: s(data.precio).replace(/[^0-9]/g, ''),
      talla: s(data.talla),
      descripcion: s(data.descripcion)
    }})
  } catch (e: any) {
    console.error('demo/analizar:', e.message)
    return NextResponse.json({ error: 'No se pudo analizar.' }, { status: 500 })
  }
}

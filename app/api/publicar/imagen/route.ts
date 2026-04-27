import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'
import OpenAI from 'openai'

const REMBG_URL = 'http://localhost:5001'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('imagen') as File
  const copy = (formData.get('copy') as string) || ''
  const titulo = (formData.get('titulo') as string) || ''
  const formato = (formData.get('formato') as string) || 'story'

  if (!file) return NextResponse.json({ error: 'Sin imagen' }, { status: 400 })

  const w = 1080
  const h = formato === 'post' ? 1080 : 1920

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    // 1. Convertir imagen a base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64input = buffer.toString('base64')

    // 2. Eliminar fondo con rembg
    const rembgRes = await fetch(`${REMBG_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: `data:image/jpeg;base64,${base64input}` })
    })
    const rembgData = await rembgRes.json()
    const productoBase64 = rembgData.image.split(',')[1]
    const productoBuffer = Buffer.from(productoBase64, 'base64')

    // 3. Generar fondo con DALL-E (con fallback a degradado)
    let fondoResized: Buffer
    try {
      const prompt = `Create a stunning ${formato === 'post' ? 'square' : 'vertical'} product photography background scene inspired by: "${titulo}". 
Style: luxury commercial photography, editorial quality, soft natural lighting.
Requirements:
- Include thematic elements related to the product ingredients or benefits (example: if coconut shampoo, show fresh coconuts, tropical leaves, water droplets)
- Beautiful bokeh background, depth of field
- Color palette: soft, warm, elegant tones matching the product theme
- NO text, NO people, NO faces, NO product bottles or packaging
- Leave center area slightly clear for product placement
- Ultra realistic, 8K quality, magazine-worthy composition`
      const dalleRes = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: formato === 'post' ? '1024x1024' : '1024x1792',
        quality: 'standard',
        n: 1
      })
      const dalleUrl = (dalleRes.data as any)[0].url as string
      const fondoRes = await fetch(dalleUrl)
      const fondoBuffer = Buffer.from(await fondoRes.arrayBuffer())
      fondoResized = await sharp(fondoBuffer)
        .resize(w, h, { fit: 'cover', position: 'center' })
        .toBuffer()
    } catch (dalleErr) {
      console.log('DALL-E falló, usando fondo degradado:', dalleErr)
      // Fondo degradado SVG como fallback
      const svgFondo = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1a1a2e"/>
            <stop offset="50%" stop-color="#16213e"/>
            <stop offset="100%" stop-color="#0f3460"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="${w*0.8}" cy="${h*0.2}" r="300" fill="rgba(99,102,241,0.15)"/>
        <circle cx="${w*0.1}" cy="${h*0.8}" r="250" fill="rgba(139,92,246,0.1)"/>
      </svg>`
      fondoResized = await sharp(Buffer.from(svgFondo))
        .resize(w, h)
        .toBuffer()
    }

    // 6. Redimensionar producto (max 70% del ancho)
    const maxProdW = Math.round(w * 0.70)
    const productoResized = await sharp(productoBuffer)
      .resize(maxProdW, Math.round(h * 0.55), { fit: 'inside' })
      .toBuffer()
    const prodMeta = await sharp(productoResized).metadata()
    const prodW = prodMeta.width || maxProdW
    const prodH = prodMeta.height || Math.round(h * 0.55)

    // Centrar producto horizontalmente, posición vertical media
    const leftPos = Math.round((w - prodW) / 2)
    const topPos = Math.round(h * 0.12)

    // 7. Montar producto sobre fondo
    const conProducto = await sharp(fondoResized)
      .composite([{ input: productoResized, left: leftPos, top: topPos }])
      .toBuffer()

    // 8. Agregar texto copy
    const lines = copy.match(/.{1,30}/g) || [copy]
    const lineHeight = 62
    const totalTextH = lines.length * lineHeight
    const textStartY = topPos + prodH + 40

    const svgText = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.75)"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${textStartY - 20}" width="${w}" height="${totalTextH + 120}" fill="url(#grad)" rx="0"/>
  ${titulo ? `<text x="${w/2}" y="${textStartY + 10}" font-family="Arial" font-size="36" font-weight="bold" fill="rgba(255,255,255,0.9)" text-anchor="middle">${titulo}</text>` : ''}
  ${lines.map((line: string, i: number) => `<text x="${w/2}" y="${textStartY + 65 + i * lineHeight}" font-family="Arial" font-size="54" font-weight="bold" fill="white" text-anchor="middle" stroke="rgba(0,0,0,0.3)" stroke-width="2">${line}</text>`).join('')}
  <text x="${w/2}" y="${textStartY + totalTextH + 95}" font-family="Arial" font-size="30" fill="rgba(255,255,255,0.7)" text-anchor="middle">✉️ Escríbenos por WhatsApp</text>
</svg>`

    const final = await sharp(conProducto)
      .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
      .jpeg({ quality: 88 })
      .toBuffer()

    return NextResponse.json({ imagen: `data:image/jpeg;base64,${final.toString('base64')}` })

  } catch (e: any) {
    console.error('Error generando imagen:', e)
    return NextResponse.json({ error: e.message || 'Error procesando imagen' }, { status: 500 })
  }
}

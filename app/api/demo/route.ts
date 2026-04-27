import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'

function generarCodigo(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `DEMO-${num}`
}

export async function POST(req: NextRequest) {
  // Rate limiting: max 10 requests por hora por IP
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const rl = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    await rl.connect()
    const key = `rl:demo:${ip}`
    const hits = await rl.incr(key)
    if (hits === 1) await rl.expire(key, 3600)
    await rl.disconnect()
    if (hits > 10) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en 1 hora.' }, { status: 429 })
    }
  } catch (e) { console.error('[demo] rate limit error:', e) }

  const { producto, precio, descripcion, negocio } = await req.json()
  if (!producto) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const codigo = generarCodigo()
  const nombre = codigo
  const negocioFinal = negocio || producto

  // Registrar lead en BD
  const lead = await prisma.demoLead.create({
    data: { nombre: codigo, negocio: negocioFinal, numero: '', producto, precio: precio||'', descripcion: descripcion||'' }
  })

  // Obtener número del bot demo
  const demoBot = await prisma.demoBot.findFirst({ where: { activo: true } })
  const numeroDemo = demoBot?.numeroDemo || '573001234567'

  // Guardar lead en Redis con el código como clave (10 min para que lo use)
  try {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    await redis.connect()
    await redis.setEx(`demo:code:${codigo}`, 600, JSON.stringify({ nombre: codigo, negocio: negocioFinal, producto, precio, descripcion }))
    await redis.disconnect()
  } catch (e) { console.error('Redis demo code:', e) }

  const waUrl = `https://wa.me/${numeroDemo}?text=${encodeURIComponent(`Hola ${codigo}`)}`
  return NextResponse.json({ ok: true, leadId: lead.id, waUrl, codigo })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  const leads = await prisma.demoLead.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(leads)
}

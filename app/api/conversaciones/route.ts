import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Redis from 'ioredis'
import { prisma } from '@/lib/prisma'

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const instance = searchParams.get('instance') || user.instance
  const numero = searchParams.get('numero')
  if (!instance) return NextResponse.json({ error: 'Falta instancia' }, { status: 400 })

  if (numero) {
    const data = await redis.get(`chat:${instance}:${numero}`)
    const history = data ? JSON.parse(data) : []
    return NextResponse.json({ instance, numero, history })
  }

  const keys = await redis.keys(`chat:${instance}:*`)

  // Buscar nombres en ventas
  const numeros = keys.map(k => k.split(':')[2])
  const ventas = await prisma.venta.findMany({
    where: { instance, numero: { in: numeros } },
    select: { numero: true, cliente: true },
    distinct: ['numero'],
    orderBy: { createdAt: 'desc' }
  })
  const nombreMap: Record<string, string> = {}
  ventas.forEach((v: { numero: string, cliente: string }) => { nombreMap[v.numero] = v.cliente })

  const chats = keys.map(k => {
    const num = k.split(':')[2]
    return { numero: num, nombre: nombreMap[num] || null, key: k }
  })

  return NextResponse.json({ instance, chats })
}

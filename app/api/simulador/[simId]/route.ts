import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ simId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { simId } = await params
  const { searchParams } = new URL(req.url)
  const desde = parseInt(searchParams.get('desde') || '0')
  console.log('poll request:', simId, 'desde:', desde)

  const { default: Redis } = await import('ioredis')
  const redisClient = new Redis('redis://127.0.0.1:6379')

  const total = await redisClient.llen(`sim:${simId}`)
  const nuevos = desde < total ? await redisClient.lrange(`sim:${simId}`, desde, -1) : []
  const statusRaw = await redisClient.get(`sim:${simId}:status`)

  await redisClient.quit()

  const mensajes = nuevos.map((m: string) => JSON.parse(m))
  let status = { done: false, ventaCerrada: false, turnos: 0 }
  try { if (statusRaw && statusRaw !== 'running') status = JSON.parse(statusRaw) } catch(e) {}

  return NextResponse.json({ mensajes, total, status })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

async function check(name: string, fn: () => Promise<string>) {
  const start = Date.now()
  try {
    const detail = await Promise.race([
      fn(),
      new Promise<string>((_, r) => setTimeout(() => r(new Error('Timeout 4s')), 4000))
    ])
    return { name, ok: true, ms: Date.now() - start, detail, error: null }
  } catch(e: any) {
    return { name, ok: false, ms: Date.now() - start, detail: null, error: e?.message || 'Error desconocido' }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const results = await Promise.all([
    check('Panel Next.js', async () => 'Corriendo en PM2'),

    check('Bot WhatsApp', async () => {
      const r = await fetch('http://localhost:3001/health')
      if (!r.ok) throw new Error('Proceso caído')
      // Verificar instancia demo conectada
      const state = await fetch(`${EVO_URL}/instance/connectionState/TuAgentX_Demo`, {
        headers: { apikey: EVO_APIKEY }
      }).then(r => r.json())
      const status = state?.instance?.state || state?.state || 'unknown'
      if (status !== 'open') throw new Error(`Demo desconectada (${status})`)
      return `Proceso OK · Demo conectada`
    }),

    check('Evolution API', async () => {
      const r = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        headers: { apikey: EVO_APIKEY }
      })
      if (!r.ok) throw new Error('No responde')
      const instances = await r.json()
      const total = instances.length
      const conectadas = instances.filter((i: any) => i.connectionStatus === 'open').length
      return `${conectadas}/${total} instancias conectadas`
    }),

    check('NocoDB', async () => {
      const r = await fetch('http://localhost:8081/api/v1/auth/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: '' })
      })
      if (r.status === 500) throw new Error('Error interno')
      return 'Respondiendo correctamente'
    }),

    check('PostgreSQL', async () => {
      const result = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as total FROM panel."PanelUser"`
      const total = Number(result[0]?.total || 0)
      return `OK · ${total} usuarios registrados`
    }),

    check('Redis', async () => {
      const { createClient } = await import('redis')
      const client = createClient({ url: process.env.REDIS_URL })
      await client.connect()
      const pong = await client.ping()
      const keys = await client.dbSize()
      await client.disconnect()
      if (pong !== 'PONG') throw new Error('Ping falló')
      return `OK · ${keys} keys en memoria`
    }),

    check('Landing page', async () => {
      const r = await fetch('https://tuagentx.com')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return `OK · HTTP ${r.status}`
    }),
  ])

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}

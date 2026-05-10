import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const AUDIT_SECRET = process.env.AUDIT_SECRET

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-audit-secret')
  if (secret !== AUDIT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const resultados: Record<string, any> = {}

  // DB Stats
  const t1 = Date.now()
  const [
    total_instancias,
    total_bots,
    total_contactos,
    total_conversaciones,
    total_mensajes,
  ] = await Promise.all([
    prisma.instance.count(),
    prisma.instance.count({ where: { connectionStatus: 'open' } }),
    prisma.contact.count(),
    prisma.chat.count(),
    prisma.message.count(),
  ])
  resultados.db_ms = Date.now() - t1

  // Bots activos vs inactivos
  const bots_caidos = await prisma.instance.findMany({
    where: { connectionStatus: { not: 'open' } },
    select: { name: true, connectionStatus: true }
  })

  // Mensajes ultimas 24h
  const hace_24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const mensajes_24h = await prisma.message.count({
    where: { messageTimestamp: { gte: Math.floor(hace_24h.getTime() / 1000) } }
  })

  // Conversaciones activas hoy
  const conversaciones_hoy = await prisma.chat.count({
    where: { updatedAt: { gte: hace_24h } }
  })

  // Tamaño de la DB
  const { stdout: db_size } = await execAsync(
    `docker exec postgres psql -U postgres -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null || echo N/A`
  ).catch(() => ({ stdout: 'N/A' }))

  // Queries lentas activas
  const { stdout: slow_queries } = await execAsync(
    `docker exec postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 second';" 2>/dev/null || echo 0`
  ).catch(() => ({ stdout: '0' }))

  const queries_lentas = parseInt(slow_queries.trim()) || 0

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    proyecto: 'panel',
    db: {
      response_ms: resultados.db_ms,
      tamano: db_size.trim(),
      queries_lentas,
      estado: queries_lentas > 3 ? 'CRITICO' : queries_lentas > 0 ? 'ALERTA' : 'OPTIMO',
    },
    instancias: {
      total: total_instancias,
      activas: total_bots,
      caidas: bots_caidos.length,
      detalle_caidas: bots_caidos,
    },
    actividad: {
      total_contactos,
      total_conversaciones,
      total_mensajes,
      mensajes_ultimas_24h: mensajes_24h,
      conversaciones_activas_hoy: conversaciones_hoy,
    },
    alertas: [
      ...bots_caidos.map((b: any) => `Bot caido: ${b.name} — estado: ${b.connectionStatus}`),
      ...(queries_lentas > 0 ? [`${queries_lentas} queries lentas en DB panel`] : []),
    ]
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { execSync } from 'child_process'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const resultado: any = {}

  // CPU y Memoria
  try {
    const memInfo = execSync('free -m').toString()
    const memLine = memInfo.split('\n')[1].trim().split(/\s+/)
    resultado.memoria = {
      total: Number(memLine[1]),
      usada: Number(memLine[2]),
      libre: Number(memLine[3]),
      porcentaje: Math.round((Number(memLine[2]) / Number(memLine[1])) * 100)
    }
    const cpuLine = execSync("top -bn1 | grep 'Cpu(s)'").toString()
    const cpuMatch = cpuLine.match(/([\d.]+)\s*us/)
    resultado.cpu = { uso: cpuMatch ? Number(cpuMatch[1]) : 0 }
  } catch(e) { resultado.memoria = null; resultado.cpu = null }

  // Disco
  try {
    const disco = execSync('df -h /srv | tail -1').toString().trim().split(/\s+/)
    resultado.disco = { total: disco[1], usado: disco[2], libre: disco[3], porcentaje: disco[4] }
  } catch(e) { resultado.disco = null }

  // Tamaño BD por tabla
  try {
    const tablas = await prisma.$queryRaw`
      SELECT tablename,
        pg_size_pretty(pg_total_relation_size('panel.'||tablename)) as size,
        pg_total_relation_size('panel.'||tablename) as bytes
      FROM pg_tables WHERE schemaname = 'panel'
      ORDER BY pg_total_relation_size('panel.'||tablename) DESC
    ` as any[]
    resultado.tablas = tablas
  } catch(e) { resultado.tablas = [] }

  // Conteo registros
  try {
    const [ventas, productos, bots, usuarios, movimientos, botLogs] = await Promise.all([
      prisma.venta.count(),
      prisma.producto.count(),
      prisma.bot.count(),
      prisma.panelUser.count(),
      prisma.movInventario.count(),
      prisma.botLog.count(),
    ])
    resultado.registros = { ventas, productos, bots, usuarios, movimientos, botLogs }
  } catch(e) { resultado.registros = null }

  // Latencia BD
  try {
    const t0 = Date.now()
    await prisma.venta.count()
    resultado.dbLatencia = Date.now() - t0
  } catch(e) { resultado.dbLatencia = null }

  // Uptime servidor
  try {
    resultado.uptime = execSync('uptime -p').toString().trim()
  } catch(e) { resultado.uptime = null }

  // PM2
  try {
    const procs = JSON.parse(execSync('pm2 jlist').toString())
    resultado.pm2 = procs.map((p: any) => ({
      name: p.name,
      status: p.pm2_env?.status,
      restarts: p.pm2_env?.restart_time,
      memoria: Math.round((p.monit?.memory || 0) / 1024 / 1024),
      cpu: p.monit?.cpu
    }))
  } catch(e) { resultado.pm2 = null }

  // Redis
  try {
    const redisInfo = execSync('docker exec redis redis-cli info memory').toString()
    const usedMatch = redisInfo.match(/used_memory_human:([\w.]+)/)
    const keys = execSync('docker exec redis redis-cli dbsize').toString().trim()
    resultado.redis = { memoria: usedMatch?.[1], keys: Number(keys) }
  } catch(e) { resultado.redis = null }

  return NextResponse.json(resultado)
}

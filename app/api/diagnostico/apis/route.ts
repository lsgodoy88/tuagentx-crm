import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Precios por 1M tokens (USD) - gpt-4o
const PRECIO_IN = 2.50
const PRECIO_OUT = 10.00

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  // Logs del mes
  const logs = await prisma.botLog.findMany({
    where: { createdAt: { gte: inicioMes }, tokensIn: { not: null } }
  })

  // Totales mes
  const totalIn = logs.reduce((a: number, l: any) => a + (l.tokensIn || 0), 0)
  const totalOut = logs.reduce((a: number, l: any) => a + (l.tokensOut || 0), 0)
  const totalMensajes = logs.length
  const costoUSD = ((totalIn / 1_000_000) * PRECIO_IN) + ((totalOut / 1_000_000) * PRECIO_OUT)

  // Por instancia
  const porInstancia: Record<string, any> = {}
  for (const log of logs) {
    if (!porInstancia[log.instance]) porInstancia[log.instance] = { mensajes: 0, tokensIn: 0, tokensOut: 0 }
    porInstancia[log.instance].mensajes++
    porInstancia[log.instance].tokensIn += log.tokensIn || 0
    porInstancia[log.instance].tokensOut += log.tokensOut || 0
  }

  // Por día (últimos 7 días)
  const hace7 = new Date()
  hace7.setDate(hace7.getDate() - 7)
  const logsSemana = await prisma.botLog.findMany({
    where: { createdAt: { gte: hace7 }, tokensIn: { not: null } }
  })
  const porDia: Record<string, number> = {}
  for (const log of logsSemana) {
    const dia = new Date(log.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    porDia[dia] = (porDia[dia] || 0) + 1
  }

  // Total histórico
  const todoLogs = await prisma.botLog.findMany({
    where: { tokensIn: { not: null } },
    select: { tokensIn: true, tokensOut: true }
  })
  const histIn = todoLogs.reduce((a: number, l: any) => a + (l.tokensIn || 0), 0)
  const histOut = todoLogs.reduce((a: number, l: any) => a + (l.tokensOut || 0), 0)
  const costoHistUSD = ((histIn / 1_000_000) * PRECIO_IN) + ((histOut / 1_000_000) * PRECIO_OUT)

  return NextResponse.json({
    mes: {
      mensajes: totalMensajes,
      tokensIn: totalIn,
      tokensOut: totalOut,
      totalTokens: totalIn + totalOut,
      costoUSD: Math.round(costoUSD * 10000) / 10000,
      costoCOP: Math.round(costoUSD * 4200)
    },
    historico: {
      tokensIn: histIn,
      tokensOut: histOut,
      costoUSD: Math.round(costoHistUSD * 10000) / 10000,
      costoCOP: Math.round(costoHistUSD * 4200)
    },
    porInstancia,
    porDia,
    modelo: 'gpt-4o',
    tarifas: { inputPer1M: PRECIO_IN, outputPer1M: PRECIO_OUT, trm: 4200 }
  })
}

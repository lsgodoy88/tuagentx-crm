import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_KEY = process.env.EVOLUTION_API_KEY || ''
const CRON_SECRET = process.env.CRON_SECRET || ''

async function enviarWA(instance: string, celular: string, mensaje: string) {
  const numero = celular.replace(/\D/g, '')
  if (!numero || numero.length < 10) return false
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: numero, text: mensaje }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 1. Buscar empresas con bot de cartera activo
  const bots = await prisma.bot.findMany({
    where: { tipo: 'cartera', activo: true },
    select: { id: true, instance: true, ownerId: true, name: true },
  })

  if (bots.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Sin bots de cartera activos', enviados: 0 })
  }

  let totalEnviados = 0
  let totalSinCelular = 0

  for (const bot of bots) {
    // 2. Buscar deudores pendientes o en recordatorio de esta empresa
    const deudores = await prisma.carteraCliente.findMany({
      where: {
        ownerId: bot.ownerId,
        estado: { in: ['pendiente', 'recordatorio'] },
        celular: { not: null },
      },
      orderBy: { diasVencido: 'desc' },
      take: 50, // máximo 50 por empresa por cron
    })

    if (deudores.length === 0) continue

    for (const deudor of deudores) {
      if (!deudor.celular) { totalSinCelular++; continue }

      const saldo = deudor.saldoActual.toLocaleString('es-CO', { minimumFractionDigits: 0 })
      const dias = deudor.diasVencido ? `${deudor.diasVencido} días` : 'varios días'
      const factura = deudor.factura ? `\nFactura: *${deudor.factura}*` : ''

      const mensaje = `Hola *${deudor.nombre}*, le saluda el equipo de cobros.${factura}\n\nTiene un saldo pendiente de *$${saldo}* con *${dias}* de vencimiento.\n\nPor favor comuníquese con nosotros para gestionar su pago o llegar a un acuerdo. Estamos para ayudarle. 🙏`

      const enviado = await enviarWA(bot.instance, deudor.celular, mensaje)

      if (enviado) {
        await prisma.carteraCliente.update({
          where: { id: deudor.id },
          data: {
            estado: 'enviado',
            avisos: { increment: 1 },
            updatedAt: new Date(),
          },
        })
        totalEnviados++
      }

      // Pausa entre mensajes para no saturar Evolution
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  return NextResponse.json({
    ok: true,
    bots_cartera: bots.length,
    enviados: totalEnviados,
    sin_celular: totalSinCelular,
    timestamp: new Date().toISOString(),
  })
}

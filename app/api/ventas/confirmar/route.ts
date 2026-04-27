import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  await prisma.venta.update({ where: { id }, data: { estado: 'confirmada' } })

  // Enviar WhatsApp al cliente
  if (venta.numero) {
    const numero = venta.numero.replace(/\D/g, '')
    const mensaje = `✅ *¡Pedido confirmado!* 🎉\n\nHola ${venta.cliente}, tu pedido *${venta.ventaId}* ha sido confirmado.\n\n📦 *${venta.producto || 'Tu pedido'}*\n💰 *$${venta.monto?.toLocaleString('es-CO') || '—'}*\n\n¿La dirección de entrega es correcta? ¿Tienes alguna observación para el envío?\n\nResponde aquí y te atendemos de inmediato 😊`

    await fetch(`${EVO_URL}/message/sendText/${venta.instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
      body: JSON.stringify({ number: numero, text: mensaje })
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

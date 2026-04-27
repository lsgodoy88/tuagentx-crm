import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, guia, transportadora, flete } = await req.json()
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  await prisma.venta.update({ where: { id }, data: { estado: 'despachada', guia: guia || null, flete: Number(flete) || 0 } })

  // Enviar WhatsApp con guía
  if (venta.numero) {
    const numero = venta.numero.replace(/\D/g, '')
    const mensaje = `📦 *¡Tu pedido está en camino!*\n\nHola ${venta.cliente}, tu pedido *${venta.ventaId}* ha sido despachado.\n\n🚚 *Transportadora:* ${transportadora}\n🔢 *Número de guía:* \`${guia}\`\n\nPuedes rastrear tu pedido en la página de ${transportadora}. Si tienes alguna duda, escríbenos aquí 😊`

    await fetch(`${EVO_URL}/message/sendText/${venta.instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
      body: JSON.stringify({ number: numero, text: mensaje })
    }).catch(() => {})
  }

  // Descontar inventario
  if (venta.producto) {
    const user = await prisma.panelUser.findFirst({ where: { bots: { some: { instance: venta.instance } } } })
    if (user) {
      const producto = await prisma.producto.findFirst({
        where: { ownerId: user.id, nombre: { contains: venta.producto, mode: 'insensitive' }, activo: true }
      })
      if (producto && producto.stock > 0) {
        await prisma.$transaction([
          prisma.movInventario.create({
            data: { productoId: producto.id, tipo: 'salida', cantidad: 1, motivo: 'Venta', ventaId: venta.ventaId || venta.id }
          }),
          prisma.producto.update({ where: { id: producto.id }, data: { stock: producto.stock - 1 } })
        ])
      }
    }
  }
  return NextResponse.json({ ok: true })
}

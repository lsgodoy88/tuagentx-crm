import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const isInternal = authHeader === 'Bearer pnl-int3rnal-2026-xK9#bot' && req.headers.get('x-internal') === 'bot'

  const body = await req.json()
  const { tipo, desde, hasta } = body

  let ownerId: string
  if (isInternal) {
    if (!body.userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    ownerId = body.userId
  } else {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user = session.user as any
    const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
    if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    ownerId = body.userId || panelUser.id
  }

  const bots = await prisma.bot.findMany({ where: { ownerId }, select: { instance: true } })
  const instances = bots.map((b: any) => b.instance)

  const where: any = { instance: { in: instances } }
  if (desde) where.createdAt = { ...where.createdAt, gte: new Date(desde) }
  if (hasta) where.createdAt = { ...where.createdAt, lte: new Date(hasta + 'T23:59:59') }

  if (tipo === 'ventas') {
    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { cliente: true, producto: true, monto: true, estado: true, createdAt: true, ciudad: true }
    })
    const total = ventas.reduce((a: number, v: any) => a + (v.monto || 0), 0)
    const porEstado = ventas.reduce((acc: any, v: any) => { acc[v.estado] = (acc[v.estado] || 0) + 1; return acc }, {})
    const porProducto = ventas.reduce((acc: any, v: any) => {
      if (v.producto) acc[v.producto] = (acc[v.producto] || 0) + (v.monto || 0)
      return acc
    }, {})
    return NextResponse.json({
      cantidad: ventas.length,
      total,
      porEstado,
      porProducto,
      ventas: ventas.slice(0, 20).map((v: any) => ({
        cliente: v.cliente,
        producto: v.producto,
        monto: v.monto,
        estado: v.estado,
        fecha: new Date(v.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      }))
    })
  }

  return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 })
}

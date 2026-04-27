import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = { ownerId: panelUser.id }
  if (estado && estado !== 'todos') where.estado = estado
  if (q) where.OR = [
    { nombre: { contains: q, mode: 'insensitive' } },
    { nit: { contains: q, mode: 'insensitive' } },
    { celular: { contains: q } },
    { factura: { contains: q, mode: 'insensitive' } },
  ]

  const [clientes, total] = await Promise.all([
    prisma.carteraCliente.findMany({ where, orderBy: { diasVencido: 'desc' }, skip, take: limit }),
    prisma.carteraCliente.count({ where })
  ])

  return NextResponse.json({ clientes, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await req.json()

  // Importación masiva
  if (Array.isArray(body)) {
    const created = await prisma.carteraCliente.createMany({
      data: body.map((c: any) => ({
        id: crypto.randomUUID(),
        ownerId: panelUser.id,
        nit: c.nit || null,
        nombre: c.nombre,
        celular: c.celular || null,
        factura: c.factura || null,
        montoVenta: c.montoVenta ? parseFloat(c.montoVenta) : null,
        saldoActual: parseFloat(c.saldoActual) || 0,
        fechaDeuda: c.fechaDeuda ? new Date(c.fechaDeuda) : null,
        diasVencido: c.diasVencido ? parseInt(c.diasVencido) : null,
        estado: 'pendiente',
      })),
      skipDuplicates: true,
    })
    return NextResponse.json({ ok: true, count: created.count })
  }

  // Creación individual
  const cliente = await prisma.carteraCliente.create({
    data: {
      id: crypto.randomUUID(),
      ownerId: panelUser.id,
      nit: body.nit || null,
      nombre: body.nombre,
      celular: body.celular || null,
      factura: body.factura || null,
      montoVenta: body.montoVenta ? parseFloat(body.montoVenta) : null,
      saldoActual: parseFloat(body.saldoActual) || 0,
      fechaDeuda: body.fechaDeuda ? new Date(body.fechaDeuda) : null,
      estado: 'pendiente',
    }
  })
  return NextResponse.json(cliente)
}

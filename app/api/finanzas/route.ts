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
  const desde = searchParams.get('desde') ? new Date(searchParams.get('desde')!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const hasta = searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : new Date()
  hasta.setHours(23, 59, 59, 999)

  const bots = await prisma.bot.findMany({ where: { ownerId: panelUser.id } })
  const instances = bots.map((b: any) => b.instance)

  const ventas = await prisma.venta.findMany({
    where: { instance: { in: instances }, estado: { in: ['despachada', 'entregada'] }, createdAt: { gte: desde, lte: hasta } }
  })

  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    include: { movimientos: { where: { tipo: 'salida', createdAt: { gte: desde, lte: hasta } } } }
  })

  const valorInventario = productos.reduce((acc: number, p: any) => acc + (p.stock * p.costo), 0)
  const ingresos = ventas.reduce((acc: number, v: any) => acc + (v.monto || 0), 0)
  const totalFletes = ventas.reduce((acc: number, v: any) => acc + (v.flete || 0), 0)

  let costoVentas = 0
  const ventasPorProducto: any[] = []
  for (const p of productos) {
    const unidades = p.movimientos.reduce((acc: number, m: any) => acc + m.cantidad, 0)
    const costo = unidades * p.costo
    const ingreso = unidades * p.precio
    costoVentas += costo
    if (unidades > 0) {
      ventasPorProducto.push({
        nombre: p.nombre,
        unidades,
        ingreso,
        costo,
        ganancia: ingreso - costo,
        margen: p.precio > 0 ? Math.round(((p.precio - p.costo) / p.precio) * 100) : 0
      })
    }
  }
  ventasPorProducto.sort((a, b) => b.ganancia - a.ganancia)

  const productosBajoMargen = productos
    .filter((p: any) => p.precio > 0)
    .map((p: any) => ({ nombre: p.nombre, margen: Math.round(((p.precio - p.costo) / p.precio) * 100), precio: p.precio, costo: p.costo, stock: p.stock }))
    .sort((a: any, b: any) => a.margen - b.margen)

  const gananciaBruta = ingresos - costoVentas - totalFletes
  const margenGeneral = ingresos > 0 ? Math.round((gananciaBruta / ingresos) * 100) : 0

  return NextResponse.json({
    periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
    resumen: { ingresos, costoVentas, totalFletes, gananciaBruta, margenGeneral, totalVentas: ventas.length },
    valorInventario, ventasPorProducto, productosBajoMargen,
    topProductos: ventasPorProducto.slice(0, 5),
  })
}

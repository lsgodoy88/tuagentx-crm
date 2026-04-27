import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const where = user.role === 'admin' ? {} : { instance: user.instance }
  const hace7dias = new Date(Date.now() - 7 * 86400000)
  const hace30dias = new Date(Date.now() - 30 * 86400000)
  const hoy = new Date(); hoy.setHours(0,0,0,0)

  const [ventasHoy, ventas7dias, ventas30dias, todasVentas] = await Promise.all([
    prisma.venta.count({ where: { ...where, createdAt: { gte: hoy } } }),
    prisma.venta.findMany({ where: { ...where, createdAt: { gte: hace7dias } }, orderBy: { createdAt: 'asc' } }),
    prisma.venta.count({ where: { ...where, createdAt: { gte: hace30dias } } }),
    prisma.venta.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 }),
  ])

  // Ventas por día
  const ventasPorDia: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
    ventasPorDia[key] = 0
  }
  ventas7dias.forEach((v: any) => {
    const key = new Date(v.createdAt).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
    if (ventasPorDia[key] !== undefined) ventasPorDia[key]++
  })

  // Top productos
  const productosMap: Record<string, {cantidad: number, monto: number}> = {}
  todasVentas.forEach((v: any) => {
    if (v.producto) {
      if (!productosMap[v.producto]) productosMap[v.producto] = { cantidad: 0, monto: 0 }
      productosMap[v.producto].cantidad++
      productosMap[v.producto].monto += v.monto || 0
    }
  })
  const topProductos = Object.entries(productosMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 7)
    .map(([nombre, data]) => ({ nombre, cantidad: data.cantidad, monto: data.monto }))

  // Por ciudad con monto
  const ciudadesMap: Record<string, {cantidad: number, monto: number}> = {}
  todasVentas.forEach((v: any) => {
    if (v.ciudad) {
      if (!ciudadesMap[v.ciudad]) ciudadesMap[v.ciudad] = { cantidad: 0, monto: 0 }
      ciudadesMap[v.ciudad].cantidad++
      ciudadesMap[v.ciudad].monto += v.monto || 0
    }
  })
  const topCiudades = Object.entries(ciudadesMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5)
    .map(([ciudad, data]) => ({ ciudad, cantidad: data.cantidad, monto: data.monto }))

  // Por bot con monto
  const botsMap: Record<string, {cantidad: number, monto: number}> = {}
  todasVentas.forEach((v: any) => {
    if (!botsMap[v.instance]) botsMap[v.instance] = { cantidad: 0, monto: 0 }
    botsMap[v.instance].cantidad++
    botsMap[v.instance].monto += v.monto || 0
  })
  const ventasPorBot = Object.entries(botsMap)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .map(([instance, data]) => ({ instance, cantidad: data.cantidad, monto: data.monto }))

  // Por empresa (admin)
  let ventasPorEmpresa: any[] = []
  if (user.role === 'admin') {
    const empresas = await prisma.panelUser.findMany({ where: { role: 'empresa' }, include: { bots: true } })
    ventasPorEmpresa = await Promise.all(empresas.map(async (e: any) => {
      const instances = e.bots.map((b: any) => b.instance)
      const total = await prisma.venta.count({ where: { instance: { in: instances } } })
      const mes = await prisma.venta.count({ where: { instance: { in: instances }, createdAt: { gte: hace30dias } } })
      return { nombre: e.name, total, mes }
    }))
    ventasPorEmpresa = ventasPorEmpresa.sort((a, b) => b.total - a.total)
  }

  // Por mes con desglose por bot
  const meses: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    meses.push(d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }))
  }
  const bots: string[] = Array.from(new Set(todasVentas.map((v: any) => v.instance as string)))
  const ventasPorMesData = meses.map(mes => {
    const row: any = { mes, total: 0, monto: 0 }
    bots.forEach(bot => { row[bot] = { cantidad: 0, monto: 0 } })
    todasVentas.forEach((v: any) => {
      const key = new Date(v.createdAt).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      if (key === mes) {
        row.total++
        row.monto += v.monto || 0
        if (row[v.instance]) { row[v.instance].cantidad++; row[v.instance].monto += v.monto || 0 }
        else row[v.instance] = { cantidad: 1, monto: v.monto || 0 }
      }
    })
    return row
  })

  return NextResponse.json({
    ventasHoy, ventas7dias: ventas7dias.length, ventas30dias,
    totalVentas: todasVentas.length,
    ventasPorDia: Object.entries(ventasPorDia).map(([dia, cantidad]) => ({ dia, cantidad })),
    topProductos, topCiudades, ventasPorBot, ventasPorEmpresa,
    ventasPorMes: ventasPorMesData,
    bots,
  })
}

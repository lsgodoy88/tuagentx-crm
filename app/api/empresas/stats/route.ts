import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const empresas = await prisma.panelUser.findMany({
    where: { role: 'empresa' },
    include: {
      bots: {
        select: { id: true, name: true, instance: true, activo: true, configurado: true, numero: true, perfil: true, slot: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const now = new Date()
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const anioInicio = new Date(now.getFullYear(), 0, 1)

  const stats = await Promise.all(empresas.map(async (e: any) => {
    const instances = e.bots.map((b: any) => b.instance)

    const [ventasHoy, ventasMes, ventasAnio, ventasTotal] = await Promise.all([
      prisma.venta.count({ where: { instance: { in: instances }, createdAt: { gte: hoy } } }),
      prisma.venta.count({ where: { instance: { in: instances }, createdAt: { gte: mesInicio } } }),
      prisma.venta.count({ where: { instance: { in: instances }, createdAt: { gte: anioInicio } } }),
      prisma.venta.count({ where: { instance: { in: instances } } }),
    ])

    const ultimasVentas = await prisma.venta.findMany({
      where: { instance: { in: instances } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, instance: true, cliente: true, resumen: true, createdAt: true }
    })

    const dias = e.planFin ? Math.ceil((new Date(e.planFin).getTime() - now.getTime()) / (1000*60*60*24)) : null

    return {
      id: e.id,
      name: e.name,
      email: e.email,
      plan: e.plan,
      periodicidad: e.periodicidad,
      planActivo: e.planActivo,
      planInicio: e.planInicio,
      planFin: e.planFin,
      diasRestantes: dias,
      createdAt: e.createdAt,
      bots: e.bots,
      ventas: { hoy: ventasHoy, mes: ventasMes, anio: ventasAnio, total: ventasTotal },
      ultimasVentas
    }
  }))

  return NextResponse.json(stats)
}

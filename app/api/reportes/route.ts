import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const empresas = await prisma.panelUser.findMany({
    where: { role: 'empresa' },
    select: { id: true, name: true, bots: { select: { instance: true } } }
  })

  const resultado = await Promise.all(empresas.map(async (e: any) => {
    const instances = e.bots.map((b: any) => b.instance)
    if (!instances.length) return { empresa: e.name, meses: [] }

    const ventas = await prisma.venta.findMany({
      where: { instance: { in: instances }, estado: { in: ['confirmada', 'despachada', 'entregada'] } },
      select: { createdAt: true, monto: true }
    })

    const mesesMap: Record<string, { mes: string, cantidad: number, total: number }> = {}
    ventas.forEach((v: any) => {
      const mes = v.createdAt.toISOString().slice(0, 7)
      if (!mesesMap[mes]) mesesMap[mes] = { mes, cantidad: 0, total: 0 }
      mesesMap[mes].cantidad++
      mesesMap[mes].total += v.monto || 0
    })

    const meses = Object.values(mesesMap).sort((a: any, b: any) => b.mes.localeCompare(a.mes))
    return { empresa: e.name, meses }
  }))

  return NextResponse.json(resultado)
}

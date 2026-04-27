import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const funcionalidades = await (prisma as any).precioFuncionalidad.findMany({
    orderBy: { precio: 'desc' }
  })

  // Empresas activas con sus bots
  const empresas = await prisma.panelUser.findMany({
    where: { role: 'empresa' },
    include: { bots: { where: { activo: true } } }
  })

  // Por ahora todas las empresas tienen las 3 funcionalidades
  // En el futuro se podrá configurar por empresa
  const totalFuncionalidades = funcionalidades.reduce((a: number, f: any) => a + f.precio, 0)

  const resumenEmpresas = empresas.map((e: any) => ({
    id: e.id,
    nombre: e.name,
    plan: e.plan,
    bots: e.bots.length,
    funcionalidades: funcionalidades.map((f: any) => ({
      codigo: f.codigo,
      nombre: f.nombre,
      precio: f.precio
    })),
    total: totalFuncionalidades
  }))

  return NextResponse.json({ funcionalidades, resumenEmpresas })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { codigo, precio } = await req.json()
  if (!codigo || precio === undefined) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const updated = await (prisma as any).precioFuncionalidad.update({
    where: { codigo },
    data: { precio: Number(precio) }
  })

  return NextResponse.json({ ok: true, updated })
}

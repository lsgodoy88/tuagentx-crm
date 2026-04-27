import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const { plan, periodicidad, meses } = await req.json()

  const empresa = await prisma.panelUser.findUnique({ where: { id } })
  if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  // Calcular fechas
  const inicio = new Date()
  const fin = new Date()
  const duracion = meses || (periodicidad === 'anual' ? 12 : 1)
  fin.setMonth(fin.getMonth() + duracion)

  // Actualizar empresa
  const updated = await prisma.panelUser.update({
    where: { id },
    data: { plan, periodicidad, planInicio: inicio, planFin: fin, planActivo: true }
  })

  // Reactivar bots respetando límite del plan
  const limitePlan = plan === 'basico' ? 1 : plan === 'pro' ? 2 : plan === 'business' ? 3 : 1
  const bots = await prisma.bot.findMany({ where: { ownerId: id }, orderBy: { createdAt: 'asc' } })
  for (let i = 0; i < bots.length; i++) {
    await prisma.bot.update({
      where: { id: bots[i].id },
      data: { activo: i < limitePlan }
    })
  }

  return NextResponse.json({ ok: true, empresa: updated })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const empresa = await prisma.panelUser.findUnique({
    where: { id },
    include: { bots: { select: { id: true, name: true, instance: true, activo: true, numero: true } } }
  })
  if (!empresa) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(empresa)
}

const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const { accion, password } = body

  // Eliminar empresa completa
  if (accion === 'eliminar_empresa') {
    await audit('EMPRESA_ELIMINADA', session.user?.email || '', `Empresa ID: ${id}`)
    const empresa = await prisma.panelUser.findUnique({
      where: { id },
      include: { bots: true }
    })
    if (!empresa) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // 1. Desconectar instancias en Evolution
    for (const bot of empresa.bots) {
      try {
        await fetch(`${EVO_URL}/instance/logout/${bot.instance}`, {
          method: 'DELETE', headers: { 'apikey': EVO_KEY }
        })
      } catch(e) { console.log('Error Evolution logout:', e) }
    }

    // 2. Eliminar datos en cascada
    await prisma.movInventario.deleteMany({ where: { producto: { ownerId: id } } })
    await prisma.producto.deleteMany({ where: { ownerId: id } })
    await prisma.venta.deleteMany({ where: { instance: { in: empresa.bots.map((b: any) => b.instance) } } })
    await prisma.botLog.deleteMany({ where: { instance: { in: empresa.bots.map((b: any) => b.instance) } } })
    await (prisma as any).inventarioAnalisis.deleteMany({ where: { ownerId: id } }).catch(() => {})
    await (prisma as any).crecerCache.deleteMany({ where: { ownerId: id } }).catch(() => {})
    await (prisma as any).marketing.deleteMany({ where: { ownerId: id } }).catch(() => {})
    await prisma.bot.deleteMany({ where: { ownerId: id } })
    await (prisma as any).empresaConfig.deleteMany({ where: { userId: id } }).catch(() => {})
    await prisma.contacto.deleteMany({ where: { ownerId: id } })
    await (prisma as any).publicacionImagen.deleteMany({ where: { publicacion: { ownerId: id } } }).catch(() => {})
    await (prisma as any).publicacion.deleteMany({ where: { ownerId: id } }).catch(() => {})
    await (prisma as any).servicio.deleteMany({ where: { ownerId: id } }).catch(() => {})
    await prisma.panelUser.delete({ where: { id } })

    await audit('EMPRESA_ACTUALIZADA', session.user?.email || '', `Empresa ID: ${id}`)
  return NextResponse.json({ ok: true })
  }

  if (accion === 'deshabilitar') {
    await prisma.panelUser.update({ where: { id }, data: { planActivo: false } })
    await prisma.bot.updateMany({ where: { ownerId: id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'habilitar') {
    await prisma.panelUser.update({ where: { id }, data: { planActivo: true } })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'reset_password') {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash(password, 10)
    await prisma.panelUser.update({ where: { id }, data: { password: hash } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Accion no reconocida' }, { status: 400 })
}

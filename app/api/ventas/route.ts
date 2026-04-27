import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarPush } from '@/lib/push'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const sessionUser = session.user as any
  // Leer siempre desde DB para evitar tokens JWT desactualizados (instance puede cambiar tras login)
  const user = await prisma.panelUser.findUnique({ where: { email: sessionUser.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const adminInstances = ['TuAgentX_Demo']
  const where = user.role === 'admin' ? { instance: { in: adminInstances } } : { instance: user.instance }
  const ventas = await prisma.venta.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(ventas)
}

export async function POST(req: NextRequest) {
  // Autenticación: sesión de panel O token interno compartido con el bot
  const session = await getServerSession(authOptions)
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  const isInternal = internalSecret && authHeader === `Bearer ${internalSecret}`
  if (!session && !isInternal) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { instance, cliente, numero, resumen, producto, ciudad, monto, cedula, direccion, observacion } = body
  if (!instance || !resumen) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }
  // Generar ventaId consecutivo por empresa
  const prefijo = instance.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
  const ultimaVenta = await prisma.venta.findFirst({
    where: { ventaId: { startsWith: prefijo + '-' } },
    orderBy: { createdAt: 'desc' }
  })
  let consecutivo = 100
  if (ultimaVenta?.ventaId) {
    const num = parseInt(ultimaVenta.ventaId.split('-')[1] || '99')
    consecutivo = num + 1
  }
  const ventaId = `${prefijo}-${String(consecutivo).padStart(4, '0')}`

  const venta = await prisma.venta.create({
    data: {
      instance,
      cliente: cliente || 'Cliente',
      numero: numero || '',
      resumen,
      producto: producto || null,
      ciudad: ciudad || null,
      monto: monto || null,
      cedula: cedula || null,
      direccion: direccion || null,
      observacion: observacion || null,
      ventaId,
    },
  })
  // Notificar venta
  try {
    const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
    const EVO_KEY = process.env.EVOLUTION_API_KEY || ''
    const BOT_DEMO = 'TuAgentX_Demo'
    const montoFmt = venta.monto ? '$' + Number(venta.monto).toLocaleString('es-CO') : 'No registrado'
    const msg = `🛍️ *Venta concretada*\n📋 Venta: ${ventaId}\n🤖 Agente: ${instance}\n💰 Valor: ${montoFmt}`

    // Notificar admin solo si es venta del demo
    if (instance === 'TuAgentX_Demo') {
      const admin = await prisma.panelUser.findFirst({
        where: { role: 'admin' },
        include: { empresaConfig: true }
      })
      if (admin?.empresaConfig?.telefono) {
        const adminNum = admin.empresaConfig.telefono.replace(/\D/g, '')
        await fetch(`${EVO_URL}/message/sendText/${BOT_DEMO}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
          body: JSON.stringify({ number: adminNum, text: msg })
        })
      }
    }

    // Buscar teléfono de la empresa dueña del bot
    const bot = await prisma.bot.findFirst({ where: { instance } })
    if (bot) {
      const empresa = await prisma.panelUser.findUnique({
        where: { id: bot.ownerId },
        include: { empresaConfig: true }
      })
      if (empresa?.empresaConfig?.telefono && empresa.role !== 'admin') {
        const empresaNum = empresa.empresaConfig.telefono.replace(/\D/g, '')
        await fetch(`${EVO_URL}/message/sendText/${instance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': bot.evoToken },
          body: JSON.stringify({ number: empresaNum, text: msg })
        })
      }
    }
  } catch(e) {
    console.log('Error notificando venta:', e)
  }

  // Push navegador
  try {
    const montoFmt = venta.monto ? '$' + Number(venta.monto).toLocaleString('es-CO') : 'Sin monto'
    const cuerpo = `Venta ${ventaId} · ${instance} · ${montoFmt}`
    // Admin
    const bot2 = await prisma.bot.findFirst({ where: { instance } })
    const ids: string[] = []
    if (instance === 'TuAgentX_Demo') {
      const admin = await prisma.panelUser.findFirst({ where: { role: 'admin' } })
      if (admin) ids.push(admin.id)
    } else if (bot2?.ownerId) {
      ids.push(bot2.ownerId)
    }
    if (ids.length > 0) await enviarPush(ids, '🛍️ Venta concretada', cuerpo, '/dashboard/ventas')
  } catch(e) {
    console.log('Error push venta:', e)
  }

  return NextResponse.json(venta)
}

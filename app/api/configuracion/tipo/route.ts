import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Acceso interno desde el bot via x-instance
  const instance = req.headers.get('x-instance')
  if (instance) {
    const bot = await prisma.bot.findFirst({ where: { instance } })
    if (!bot) return NextResponse.json({ tipoNegocio: 'productos' })
    const panelUser = await prisma.panelUser.findUnique({ where: { id: bot.ownerId } })
    return NextResponse.json({ tipoNegocio: panelUser?.tipoNegocio || 'productos' })
  }
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ tipoNegocio: panelUser.tipoNegocio })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const { tipoNegocio } = await req.json()
  if (!['productos', 'servicios'].includes(tipoNegocio)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  const panelUser = await prisma.panelUser.update({
    where: { email: user.email },
    data: { tipoNegocio }
  })
  return NextResponse.json({ tipoNegocio: panelUser.tipoNegocio })
}

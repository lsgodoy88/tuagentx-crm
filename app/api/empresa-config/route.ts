import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const config = await prisma.empresaConfig.findUnique({ where: { userId: panelUser.id } })
  return NextResponse.json(config || {})
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const body = await req.json()
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const config = await prisma.empresaConfig.upsert({
    where: { userId: panelUser.id },
    update: { ...body },
    create: { userId: panelUser.id, ...body }
  })
  return NextResponse.json(config)
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  await prisma.pushSuscripcion.upsert({
    where: { userId_endpoint: { userId: panelUser.id, endpoint } },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { id: crypto.randomUUID(), userId: panelUser.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { endpoint } = await req.json()
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.pushSuscripcion.deleteMany({
    where: { userId: panelUser.id, endpoint }
  })
  return NextResponse.json({ ok: true })
}

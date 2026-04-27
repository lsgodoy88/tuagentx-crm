import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const { nombre, passwordActual, passwordNuevo } = await req.json()

  const dbUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const updateData: any = {}
  if (nombre) updateData.name = nombre

  if (passwordNuevo) {
    if (!passwordActual) return NextResponse.json({ error: 'Ingresa tu contraseña actual' }, { status: 400 })
    const valid = await bcrypt.compare(passwordActual, dbUser.password)
    if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    updateData.password = await bcrypt.hash(passwordNuevo, 10)
  }

  await prisma.panelUser.update({ where: { email: user.email }, data: updateData })
  return NextResponse.json({ ok: true })
}

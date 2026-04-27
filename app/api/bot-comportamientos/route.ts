import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidarCacheComportamientos } from '@/lib/redis'

async function adminOnly() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  const user = session.user as any
  if (user.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await adminOnly()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const lista = await prisma.botComportamiento.findMany({
    orderBy: [{ prioridad: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(lista)
}

export async function POST(req: NextRequest) {
  const user = await adminOnly()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { trigger, tipo, respuesta, accion, activo, prioridad } = await req.json()
  if (!trigger || !tipo) return NextResponse.json({ error: 'Faltan: trigger, tipo' }, { status: 400 })

  const row = await prisma.botComportamiento.create({
    data: {
      trigger: trigger.trim(),
      tipo,
      respuesta: respuesta || null,
      accion: accion || null,
      activo: activo !== false,
      prioridad: prioridad ?? 0,
    },
  })
  await invalidarCacheComportamientos()
  return NextResponse.json(row)
}

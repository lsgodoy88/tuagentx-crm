import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const etiqueta = searchParams.get('etiqueta') || ''
  const contactos = await (prisma as any).contacto.findMany({
    where: {
      ownerId: panelUser.id,
      ...(q ? { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { numero: { contains: q } }] } : {}),
      ...(etiqueta ? { etiqueta } : {})
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(contactos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const body = await req.json()

  // Importar múltiples o crear uno
  if (Array.isArray(body)) {
    let creados = 0, omitidos = 0
    for (const c of body) {
      if (!c.numero) continue
      try {
        await (prisma as any).contacto.upsert({
          where: { ownerId_numero: { ownerId: panelUser.id, numero: String(c.numero).trim() } },
          update: { nombre: c.nombre || null, ciudad: c.ciudad || null, email: c.email || null, etiqueta: c.etiqueta || null },
          create: { ownerId: panelUser.id, numero: String(c.numero).trim(), nombre: c.nombre || null, ciudad: c.ciudad || null, email: c.email || null, etiqueta: c.etiqueta || null }
        })
        creados++
      } catch { omitidos++ }
    }
    return NextResponse.json({ ok: true, creados, omitidos })
  }

  const contacto = await (prisma as any).contacto.upsert({
    where: { ownerId_numero: { ownerId: panelUser.id, numero: String(body.numero).trim() } },
    update: { nombre: body.nombre || null, ciudad: body.ciudad || null, email: body.email || null, etiqueta: body.etiqueta || null },
    create: { ownerId: panelUser.id, numero: String(body.numero).trim(), nombre: body.nombre || null, ciudad: body.ciudad || null, email: body.email || null, etiqueta: body.etiqueta || null }
  })
  return NextResponse.json(contacto)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { ids } = await req.json()
  await (prisma as any).contacto.deleteMany({ where: { id: { in: ids } } })
  return NextResponse.json({ ok: true })
}

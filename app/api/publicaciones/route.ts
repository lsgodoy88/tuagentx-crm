import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const publicaciones = await prisma.publicacion.findMany({
    where: { ownerId: panelUser.id },
    include: { imagenes: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(publicaciones)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await req.json()
  // body.imagenes = [{ imgUrl, imgPath, caption }]
  const { imagenes, canales, agentes, frecuencia, horaEnvio, proximoEnvio } = body

  if (!imagenes?.length) return NextResponse.json({ error: 'Sin imágenes' }, { status: 400 })

  const pub = await prisma.publicacion.create({
    data: {
      ownerId: panelUser.id,
      canales: JSON.stringify(canales || ['whatsapp']),
      agentes: JSON.stringify(agentes || []),
      frecuencia: frecuencia || '24h',
      horaEnvio: horaEnvio || '08:00',
      proximoEnvio: proximoEnvio ? new Date(proximoEnvio) : null,
      estado: 'programada',
      bucle: frecuencia !== 'none',
      imagenes: {
        create: imagenes.map((img: any) => ({
          imagenUrl: img.imgUrl,
          imagenPath: img.imgPath,
          caption: img.caption || null,
        }))
      }
    },
    include: { imagenes: true }
  })
  return NextResponse.json(pub)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await req.json()
  await prisma.publicacion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const formData = await req.formData()
  const file = formData.get('logo') as File
  if (!file) return NextResponse.json({ error: 'No hay archivo' }, { status: 400 })

  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const dir = path.join(process.cwd(), 'public', 'logos')
  await mkdir(dir, { recursive: true })
  const ext = file.name.split('.').pop()
  const filename = `logo_${panelUser.id}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), buffer)

  await prisma.empresaConfig.upsert({
    where: { userId: panelUser.id },
    update: { logo: `/logos/${filename}` },
    create: { userId: panelUser.id, logo: `/logos/${filename}` }
  })

  return NextResponse.json({ logo: `/logos/${filename}` })
}

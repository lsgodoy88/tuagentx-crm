import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('imagen') as File
  if (!file) return NextResponse.json({ error: 'No se recibió imagen' }, { status: 400 })

  // Validar tipo
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WEBP' }, { status: 400 })
  }

  // Crear carpeta si no existe
  const dir = `/srv/whatsapp-stack/media/${bot.instance}/productos`
  fs.mkdirSync(dir, { recursive: true })

  // Guardar archivo
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const nombre = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filepath = path.join(dir, nombre)

  const bytes = await file.arrayBuffer()
  fs.writeFileSync(filepath, Buffer.from(bytes))

  return NextResponse.json({ ok: true, nombre })
}

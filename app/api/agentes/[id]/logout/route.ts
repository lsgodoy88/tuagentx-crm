import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  try {
    await fetch(`${EVO_URL}/instance/logout/${bot.instance}`, {
      method: 'DELETE',
      headers: { 'apikey': EVO_APIKEY },
    })

    await prisma.bot.update({
      where: { id },
      data: { activo: false, numero: null, perfil: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

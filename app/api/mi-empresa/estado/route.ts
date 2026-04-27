import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any

  if (user.role === 'admin') return NextResponse.json({ activa: true })

  const panelUser = await prisma.panelUser.findUnique({
    where: { email: user.email },
    select: { planActivo: true, planFin: true },
  })
  const planFin = panelUser?.planFin ?? null
  const diasRestantes = planFin
    ? Math.ceil((new Date(planFin).getTime() - Date.now()) / 86400000)
    : null
  return NextResponse.json({ activa: panelUser?.planActivo ?? true, planFin, diasRestantes })
}

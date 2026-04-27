import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any

  if (user.role === 'admin') {
    const empresas = await prisma.panelUser.findMany({
      where: { role: 'empresa' },
      select: { id: true, name: true, email: true, instance: true, plan: true, periodicidad: true, planInicio: true, planFin: true, planActivo: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(empresas)
  }

  const empresa = await prisma.panelUser.findUnique({
    where: { email: user.email },
    select: { id: true, name: true, email: true, plan: true, periodicidad: true, planInicio: true, planFin: true, planActivo: true }
  })
  return NextResponse.json(empresa)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { name, email, password, plan } = await req.json()
  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(password, 10)
  const empresa = await prisma.panelUser.create({
    data: { name, email, password: hash, role: 'empresa', plan: plan || 'basico' }
  })
  return NextResponse.json(empresa)
}

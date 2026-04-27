import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ count: 0 })
  const user = session.user as any
  let where: any = { estado: 'nueva' }
  if (user.role === 'admin') {
    where.instance = { in: ['TuAgentX_Demo'] }
  } else {
    const dbUser = await prisma.panelUser.findUnique({
      where: { email: user.email },
      include: { bots: true }
    })
    const instances = dbUser?.bots.map((b: any) => b.instance) || []
    where.instance = { in: instances }
  }
  const count = await prisma.venta.count({ where })
  return NextResponse.json({ count })
}

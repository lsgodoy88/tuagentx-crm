import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { instance, evento, estado, ms, tokensIn, tokensOut, modelo, error } = await req.json()

  await prisma.botLog.create({
    data: { instance, evento, estado, ms: ms || null, tokensIn: tokensIn || null, tokensOut: tokensOut || null, modelo: modelo || null, error: error || null }
  })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { codigo, numero } = await req.json()
  if (!codigo || !numero) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const lead = await prisma.demoLead.findFirst({ where: { nombre: codigo } })
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const updated = await prisma.demoLead.update({
    where: { id: lead.id },
    data: { numero }
  })

  return NextResponse.json({ ok: true, id: updated.id, numero: updated.numero })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const cliente = await prisma.carteraCliente.update({
    where: { id },
    data: {
      estado: body.estado || undefined,
      acuerdoCuotas: body.acuerdoCuotas || undefined,
      acuerdoFecha: body.acuerdoFecha ? new Date(body.acuerdoFecha) : undefined,
      acuerdoNota: body.acuerdoNota || undefined,
      saldoActual: body.saldoActual !== undefined ? parseFloat(body.saldoActual) : undefined,
      avisos: body.avisos !== undefined ? body.avisos : undefined,
    }
  })
  return NextResponse.json(cliente)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.carteraCliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'empresa') return NextResponse.json({ error: 'Solo disponible para empresas' }, { status: 403 })

  console.log('[renovacion] usuario:', user.id, user.email, user.role)

  const funcionalidades = await (prisma as any).precioFuncionalidad.findMany()
  const monto: number = funcionalidades.reduce((a: number, f: any) => a + f.precio, 0)
  console.log('[renovacion] monto calculado:', monto, '| funcionalidades:', funcionalidades.length)

  if (monto <= 0) {
    console.error('[renovacion] monto inválido:', monto)
    return NextResponse.json({ error: 'No se pudo calcular el monto del plan' }, { status: 400 })
  }

  const secret = process.env.MASTER_API_SECRET
  if (!secret) {
    console.error('[renovacion] MASTER_API_SECRET no definido')
    return NextResponse.json({ error: 'Configuración interna incompleta' }, { status: 500 })
  }

  const res = await fetch('http://localhost:3020/api/pagos/crear-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify({
      empresaId: user.id,
      empresaTipo: 'CRM',
      monto,
      planDias: 30,
    }),
  })

  const bodyText = await res.text()
  console.log('[renovacion] master status:', res.status, '| body:', bodyText)

  if (!res.ok) {
    const err = JSON.parse(bodyText).catch?.(() => ({})) ?? {}
    return NextResponse.json({ error: err.error ?? 'Error al generar el link de pago' }, { status: 502 })
  }

  const data = JSON.parse(bodyText)
  console.log('[renovacion] linkPago:', data.linkPago)
  return NextResponse.json({ linkPago: data.linkPago })
}

import { NextRequest, NextResponse } from 'next/server'
import { validarWhatsapp, normalizarNumero } from '@/lib/validarWhatsapp'

/* ─── Rate limiter: 5 req / IP / 60s ───────────────────────────────────── */
const rlMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now  = Date.now()
  const hits = (rlMap.get(ip) ?? []).filter(t => now - t < 60_000)
  if (hits.length >= 5) return true
  hits.push(now)
  rlMap.set(ip, hits)
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes, espera un momento' }, { status: 429 })
  }

  const { numero } = await req.json()
  if (!numero || typeof numero !== 'string') {
    return NextResponse.json({ valido: false }, { status: 400 })
  }

  if (!normalizarNumero(numero)) {
    return NextResponse.json({ valido: false })
  }

  const valido = await validarWhatsapp(numero)
  return NextResponse.json({ valido })
}

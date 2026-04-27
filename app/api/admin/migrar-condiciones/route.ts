import { NextResponse } from 'next/server'

// Migración one-time ya ejecutada (columna condiciones en NocoDB, 2026-03).
// NocoDB retirado — este endpoint ya no tiene utilidad.
export async function POST() {
  return NextResponse.json({ ok: false, message: 'Migración ya ejecutada y NocoDB retirado.' }, { status: 410 })
}

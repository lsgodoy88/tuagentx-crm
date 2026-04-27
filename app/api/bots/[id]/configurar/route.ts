import { NextResponse } from 'next/server'

// Ruta reemplazada por /api/agentes/[id]/configurar (post-migración NocoDB → Postgres JSONB)
export async function POST() {
  return NextResponse.json({ error: 'Endpoint retirado. Usa /api/agentes/[id]/configurar' }, { status: 410 })
}

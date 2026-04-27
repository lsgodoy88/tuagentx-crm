import { NextResponse } from 'next/server'

// Ruta reemplazada por /api/agentes/[id]/datos (post-migración NocoDB → Postgres JSONB)
export async function GET() {
  return NextResponse.json({ error: 'Endpoint retirado. Usa /api/agentes/[id]/datos' }, { status: 410 })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const internalSecret = process.env.PANEL_INTERNAL_SECRET
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const row = await prisma.demoBot.findFirst()
  return NextResponse.json({
    activo: row?.activo ?? true,
    promptVendedor: row?.promptVendedor || null,
    mensajeDespedida: row?.mensajeDespedida || null,
    tiempoSesion: row?.tiempoSesion ?? 120,
    nombreAgente: row?.nombreAgente || null,
    fotoAgente: row?.fotoAgente || null,
  })
}

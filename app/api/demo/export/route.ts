import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const leads = await prisma.demoLead.findMany({ orderBy: { createdAt: 'desc' } })

  const XLSX = await import('xlsx' as any)
  const data = leads.map((l: any) => ({
    Nombre: l.nombre,
    Negocio: l.negocio,
    Numero: l.numero,
    Producto: l.producto,
    Precio: l.precio,
    Descripcion: l.descripcion,
    Fecha: new Date(l.createdAt).toLocaleString('es-CO')
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Leads Demo')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads_demo.xlsx"'
    }
  })
}

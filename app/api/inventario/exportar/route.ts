import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

const COLS: { header: string; note: string; key: keyof any }[] = [
  { header: 'Código',       note: 'No modificar — es el identificador único del producto',                            key: 'codigo'      },
  { header: 'Nombre',       note: 'Nombre completo del producto',                                                     key: 'nombre'      },
  { header: 'Descripción',  note: 'Características y beneficios del producto',                                        key: 'descripcion' },
  { header: 'Costo',        note: 'Precio de compra o producción (solo números)',                                     key: 'costo'       },
  { header: 'Precio',       note: 'Precio de venta al cliente (solo números)',                                        key: 'precio'      },
  { header: 'Stock',        note: 'Cantidad disponible en inventario (solo números)',                                  key: 'stock'       },
  { header: 'Stock Mínimo', note: 'Alerta cuando el stock baje de este número',                                       key: 'stockMin'    },
  { header: 'Oferta',       note: 'Promoción activa: ej. 10%, 2x1, Gratis envío — el agente la usará para retener clientes', key: 'oferta' },
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    where: { ownerId: panelUser.id, activo: true },
    orderBy: { createdAt: 'asc' },
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'TuAgentX'
  const ws = wb.addWorksheet('Productos')

  // ── Encabezados ──────────────────────────────────────────────────────────
  const headerRow = ws.addRow(COLS.map(c => c.header))
  headerRow.eachCell((cell, colIdx) => {
    const isCodigoCol = colIdx === 1

    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a5c38' },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF0d3d24' } },
    }

    // Nota/comentario en cada encabezado
    cell.note = {
      texts: [{ font: { size: 9 }, text: COLS[colIdx - 1].note }],
    } as any

    // Columna Código: fondo diferente para indicar que es de sólo lectura
    if (isCodigoCol) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2e7d50' }, // verde más oscuro para distinguirla
      }
    }
  })

  // ── Filas de datos ───────────────────────────────────────────────────────
  for (const p of productos as any[]) {
    const dataRow = ws.addRow([
      p.codigo,
      p.nombre,
      p.descripcion ?? '',
      p.costo,
      p.precio,
      p.stock,
      p.stockMin,
      p.oferta ?? '',
    ])

    // Columna Código: fondo gris claro para indicar que no debe editarse
    const codigoCell = dataRow.getCell(1)
    codigoCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    }
    codigoCell.font = { color: { argb: 'FF555555' }, italic: true }
    codigoCell.alignment = { horizontal: 'center' }
  }

  // ── Ancho automático basado en contenido ─────────────────────────────────
  ws.columns.forEach((col, i) => {
    const headerLen = COLS[i].header.length
    let maxLen = headerLen

    col.eachCell?.({ includeEmpty: false }, cell => {
      const val = cell.value != null ? String(cell.value) : ''
      if (val.length > maxLen) maxLen = val.length
    })

    col.width = Math.min(Math.max(maxLen + 4, 12), 50)
  })

  // Altura fija del encabezado
  headerRow.height = 22

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="inventario.xlsx"',
    },
  })
}

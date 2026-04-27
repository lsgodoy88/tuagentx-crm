import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const wb = XLSX.utils.book_new()

  const rows = [
    ['Código', 'Nombre *', 'Descripción', 'Costo', 'Precio', 'Stock', 'Stock Mínimo'],
    ['PRD-001', 'Ejemplo Producto', 'Descripción opcional', 15000, 25000, 10, 3],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 30 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_inventario.xlsx"',
    },
  })
}

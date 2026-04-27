import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// Columnas esperadas (índice base 0):
// [0] Código  [1] Nombre  [2] Descripción  [3] Costo  [4] Precio  [5] Stock  [6] Stock Mínimo  [7] Oferta

function parseRows(allRows: any[]) {
  // Detectar fila encabezado
  let headerRow = -1
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    if (!row) continue
    const c0 = String(row[0] ?? '').toLowerCase()
    const c1 = String(row[1] ?? '').toLowerCase()
    if (c0.includes('código') || c0.includes('codigo') || c1.includes('nombre')) {
      headerRow = i
      break
    }
  }
  if (headerRow === -1) return null

  const filas: any[] = []
  for (let i = headerRow + 1; i < allRows.length; i++) {
    const row = allRows[i]
    if (!row) continue
    const nombre = row[1] ? String(row[1]).trim() : ''
    const precio = Number(row[4]) || 0
    if (!nombre && !row[0]) continue // fila completamente vacía

    const codigo = row[0] ? String(row[0]).trim() : ''
    const descripcion = row[2] ? String(row[2]).trim() : ''
    const costo = Number(row[3]) || 0
    const stock = Number(row[5]) || 0
    const stockMin = Number(row[6]) || 3
    const oferta = row[7] ? String(row[7]).trim() : ''

    let status: 'valid' | 'invalid' | 'warning' = 'valid'
    let error = ''
    if (!nombre || precio <= 0) {
      status = 'invalid'
      error = !nombre ? 'Falta nombre' : 'Precio requerido'
    } else if (stock === 0) {
      status = 'warning'
    }

    filas.push({ codigo, nombre, descripcion, costo, precio, stock, stockMin, oferta, status, error })
  }
  return filas
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const isPreview = url.searchParams.get('preview') === '1'

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const allRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 })

  const filas = parseRows(allRows)
  if (filas === null) {
    return NextResponse.json({ error: 'No se encontró encabezado. Descarga el inventario actual como base.' }, { status: 400 })
  }

  // Modo preview: devolver filas parseadas sin guardar
  if (isPreview) {
    return NextResponse.json({ filas })
  }

  // Modo importación real: solo procesar filas válidas o con advertencia
  let contadorCodigo = await prisma.producto.count({ where: { ownerId: panelUser.id } })
  let creados = 0
  let actualizados = 0

  for (const fila of filas) {
    if (fila.status === 'invalid') continue
    const { codigo: codigoExcel, nombre, descripcion, costo, precio, stock, stockMin, oferta } = fila

    if (codigoExcel) {
      const existente = await prisma.producto.findUnique({ where: { codigo: codigoExcel } })

      if (existente && existente.ownerId === panelUser.id) {
        await prisma.producto.update({
          where: { codigo: codigoExcel },
          data: { nombre, descripcion: descripcion || null, costo, precio, stock, stockMin, oferta: oferta || null },
        })
        actualizados++
        continue
      }

      if (existente && existente.ownerId !== panelUser.id) {
        // Código tomado por otro usuario → auto-generar
        contadorCodigo++
        const codigoNuevo = `PRD-${String(contadorCodigo).padStart(3, '0')}`
        await crearProducto(panelUser.id, codigoNuevo, nombre, descripcion || null, costo, precio, stock, stockMin, oferta || null)
        creados++
        continue
      }

      await crearProducto(panelUser.id, codigoExcel, nombre, descripcion || null, costo, precio, stock, stockMin, oferta || null)
      creados++
    } else {
      contadorCodigo++
      const codigo = `PRD-${String(contadorCodigo).padStart(3, '0')}`
      await crearProducto(panelUser.id, codigo, nombre, descripcion || null, costo, precio, stock, stockMin, oferta || null)
      creados++
    }
  }

  return NextResponse.json({ creados, actualizados })
}

async function crearProducto(
  ownerId: string, codigo: string, nombre: string,
  descripcion: string | null, costo: number, precio: number,
  stock: number, stockMin: number, oferta: string | null
) {
  const producto = await prisma.producto.create({
    data: { codigo, nombre, descripcion, costo, precio, stock, stockMin, oferta, ownerId },
  })
  if (stock > 0) {
    await prisma.movInventario.create({
      data: { productoId: producto.id, tipo: 'entrada', cantidad: stock, motivo: 'Importación Excel' },
    })
  }
  return producto
}

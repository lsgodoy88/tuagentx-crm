'use client'
import { useEffect, useState, useRef } from 'react'
import { fetchApi } from '@/lib/fetchApi'
import ExcelJS from 'exceljs'

const ESTADOS = [
  { id: 'todos', label: 'Todos', color: 'bg-zinc-700', dot: '⬜' },
  { id: 'pendiente', label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: '🟡' },
  { id: 'enviado', label: 'Enviado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: '📤' },
  { id: 'en_gestion', label: 'En gestión', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dot: '💬' },
  { id: 'acuerdo', label: 'Acuerdo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: '🤝' },
  { id: 'recordatorio', label: 'Recordatorio', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: '⏰' },
  { id: 'pagado', label: 'Pagado', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: '✅' },
  { id: 'sin_responder', label: 'Sin responder', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', dot: '🔕' },
  { id: 'se_niega', label: 'Se niega', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: '❌' },
]

export default function CarteraPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalImport, setModalImport] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadClientes() }, [estado, buscar, page])

  async function loadClientes() {
    setLoading(true)
    const params = new URLSearchParams({ estado, q: buscar, page: String(page) })
    const data = await fetchApi('/api/cartera?' + params)
    if (data) { setClientes(data.clientes || []); setTotal(data.total || 0) }
    setLoading(false)
  }

  async function descargarPlantilla() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Cartera')
    ws.columns = [
      { header: 'nit', key: 'nit', width: 15 },
      { header: 'nombre', key: 'nombre', width: 30 },
      { header: 'celular', key: 'celular', width: 15 },
      { header: 'factura', key: 'factura', width: 15 },
      { header: 'monto_venta', key: 'monto_venta', width: 15 },
      { header: 'saldo_actual', key: 'saldo_actual', width: 15 },
      { header: 'fecha_deuda', key: 'fecha_deuda', width: 15 },
    ]
    const obligatorias = ['nombre', 'saldo_actual']
    ws.getRow(1).eachCell((cell, colNum) => {
      const key = ws.getColumn(colNum).key as string
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: obligatorias.includes(key) ? 'FF16A34A' : 'FF71717A' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ws.getRow(1).height = 20
    ws.addRow({ nit: '900123456', nombre: 'Empresa Ejemplo', celular: '3001234567', factura: 'FAC-001', monto_venta: 500000, saldo_actual: 350000, fecha_deuda: '2026-01-15' })
    const buf = await wb.xlsx.writeBuffer()
    const url = URL.createObjectURL(new Blob([buf]))
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_cartera.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)
      const ws = wb.worksheets[0]
      const rows: any[] = []
      const headers: string[] = []
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          row.eachCell((cell, col) => { headers[col] = String(cell.value || '').trim().toLowerCase() })
        } else {
          const obj: any = {}
          headers.forEach((h, col) => { if (h) obj[h] = row.getCell(col).value ?? '' })
          const tieneValor = Object.values(obj).some(v => v !== '' && v !== null && v !== undefined)
          if (tieneValor) rows.push(obj)
        }
      })
      const errores: any[] = []
      const validos = rows.map((r, i) => ({
        fila: i + 2,
        nit: String(r['nit'] || ''),
        nombre: r['nombre'] || r['Nombre'] || '',
        celular: String(r['celular'] || ''),
        factura: String(r['factura'] || ''),
        montoVenta: r['monto_venta'] || r['monto venta'] || '',
        saldoActual: r['saldo_actual'] || r['saldo actual'] || '',
        fechaDeuda: r['fecha_deuda'] || r['fecha deuda'] || '',
      })).filter(r => {
        const faltantes: string[] = []
        if (!r.nombre) faltantes.push('nombre')
        if (!r.saldoActual) faltantes.push('saldo_actual')
        if (faltantes.length > 0) { errores.push({ fila: r.fila, nombre: r.nombre || '(sin nombre)', faltantes }); return false }
        return true
      })
      setImportErrors(errores)
      setImportData(validos)
      setModalImport(true)
    }
    reader.readAsArrayBuffer(file)
  }

  async function importar() {
    setImporting(true)
    await fetchApi('/api/cartera', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(importData) })
    setImporting(false)
    setModalImport(false)
    setImportData([])
    setImportErrors([])
    loadClientes()
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    await fetchApi(`/api/cartera/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado }) })
    loadClientes()
    if (selected?.id === id) setSelected({ ...selected, estado: nuevoEstado })
  }

  function getEstado(id: string) { return ESTADOS.find(e => e.id === id) || ESTADOS[1] }

  const totalSaldo = clientes.reduce((a, c) => a + (c.saldoActual || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Cartera</h1>
          <p className="text-zinc-400 text-sm mt-1">{total} deudores · Saldo total: ${totalSaldo.toLocaleString('es-CO')}</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <button onClick={descargarPlantilla} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-xl border border-zinc-700">📋 Plantilla</button>
          <button onClick={() => fileRef.current?.click()} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-xl border border-zinc-700">📥 Importar</button>
        </div>
      </div>

      {/* Filtros estado */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map(e => (
          <button key={e.id} onClick={() => { setEstado(e.id); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${estado === e.id ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
            {e.dot} {e.label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <input value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1) }}
        placeholder="Buscar por nombre, NIT, factura..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-zinc-500 py-10">Cargando...</div>
        ) : clientes.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-zinc-400">No hay deudores en esta categoría</p>
          </div>
        ) : clientes.map((c: any) => (
          <div key={c.id} onClick={() => setSelected(c)}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-zinc-600 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{c.nombre}</p>
                  {c.nit && <span className="text-zinc-500 text-xs">NIT: {c.nit}</span>}
                </div>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {c.factura && <span className="text-zinc-400 text-xs">📄 {c.factura}</span>}
                  {c.celular && <span className="text-zinc-400 text-xs">📱 {c.celular}</span>}
                  {c.diasVencido && <span className="text-red-400 text-xs">⏱ {c.diasVencido} días vencido</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-emerald-400 font-bold text-sm">${(c.saldoActual || 0).toLocaleString('es-CO')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${getEstado(c.estado).color}`}>
                  {getEstado(c.estado).dot} {getEstado(c.estado).label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-sm disabled:opacity-40">← Anterior</button>
          <span className="text-zinc-400 text-sm py-1">Página {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total} className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-sm disabled:opacity-40">Siguiente →</button>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">{selected.nombre}</h3>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {selected.nit && <p className="text-zinc-400">NIT: <span className="text-white">{selected.nit}</span></p>}
              {selected.celular && <p className="text-zinc-400">WhatsApp: <span className="text-white">{selected.celular}</span></p>}
              {selected.factura && <p className="text-zinc-400">Factura: <span className="text-white">{selected.factura}</span></p>}
              {selected.montoVenta && <p className="text-zinc-400">Venta original: <span className="text-white">${selected.montoVenta.toLocaleString('es-CO')}</span></p>}
              <p className="text-zinc-400">Saldo actual: <span className="text-emerald-400 font-bold">${(selected.saldoActual || 0).toLocaleString('es-CO')}</span></p>
              {selected.diasVencido && <p className="text-zinc-400">Días vencido: <span className="text-red-400">{selected.diasVencido}</span></p>}
              {selected.avisos > 0 && <p className="text-zinc-400">Avisos enviados: <span className="text-white">{selected.avisos}</span></p>}
              {selected.acuerdoFecha && <p className="text-zinc-400">Fecha acuerdo: <span className="text-white">{new Date(selected.acuerdoFecha).toLocaleDateString('es-CO')}</span></p>}
              {selected.acuerdoCuotas && <p className="text-zinc-400">Cuotas acordadas: <span className="text-white">{selected.acuerdoCuotas}</span></p>}
              {selected.acuerdoNota && <p className="text-zinc-400">Nota: <span className="text-white">{selected.acuerdoNota}</span></p>}
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold mb-2">Cambiar estado:</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.filter(e => e.id !== 'todos').map(e => (
                  <button key={e.id} onClick={() => cambiarEstado(selected.id, e.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selected.estado === e.id ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {e.dot} {e.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="w-full bg-zinc-800 text-white py-2.5 rounded-xl text-sm">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal importar */}
      {modalImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-bold text-lg">Importar cartera</h3>
            {importData.length > 0 && (
              <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-3">
                <p className="text-emerald-400 text-sm font-semibold">✅ {importData.length} deudores listos para importar</p>
                <p className="text-emerald-600 text-xs mt-1">Desde <span className="text-emerald-400">{importData[0].nombre}</span> hasta <span className="text-emerald-400">{importData[importData.length-1].nombre}</span></p>
              </div>
            )}
            {importErrors.length > 0 && (
              <div className="bg-red-950 border border-red-800 rounded-xl p-3 space-y-2">
                <p className="text-red-400 text-sm font-semibold">⚠️ {importErrors.length} filas con errores (no se importarán)</p>
                <table className="w-full text-xs">
                  <thead><tr className="text-red-500"><th className="text-left pr-3">Fila</th><th className="text-left pr-3">Nombre</th><th className="text-left">Faltantes</th></tr></thead>
                  <tbody>{importErrors.map((e, i) => <tr key={i} className="border-t border-red-900"><td className="text-red-400 pr-3 py-1">{e.fila}</td><td className="text-white pr-3 py-1">{e.nombre}</td><td className="text-red-300 py-1">{e.faltantes.join(', ')}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setModalImport(false); setImportData([]); setImportErrors([]) }} className="flex-1 bg-zinc-800 text-white text-sm py-3 rounded-xl">Cancelar</button>
              {importData.length > 0 && importErrors.length === 0 && (
                <button onClick={importar} disabled={importing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl">
                  {importing ? 'Importando...' : `Importar ${importData.length}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

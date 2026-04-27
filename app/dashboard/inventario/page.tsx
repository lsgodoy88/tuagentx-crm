'use client'
import { fetchApi, errorMsg } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function InventarioPage() {
  const { data: session } = useSession()
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'nuevo' | 'editar' | 'movimiento' | 'historial' | null>(null)
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', costo: '', precio: '', stock: '', stockMin: '3' })
  const [movForm, setMovForm] = useState({ tipo: 'entrada', cantidad: '', motivo: '' })
  const [historial, setHistorial] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importParsing, setImportParsing] = useState(false)
  const [importando, setImportando] = useState(false)
  const [importResult, setImportResult] = useState<{ok: boolean, text: string} | null>(null)
  const [dragging, setDragging] = useState(false)
  const [analisis, setAnalisis] = useState<any>(null)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)
  const [showAnalisis, setShowAnalisis] = useState(false)
  const [analisisGeneradoEl, setAnalisisGeneradoEl] = useState<string|null>(null)
  const [analisisVigente, setAnalisisVigente] = useState(false)

  useEffect(() => {
    fetchProductos()
    fetch('/api/inventario/analisis').then(r => r.json()).then(d => {
      if (d.cached && d.data) {
        setAnalisis(d.data)
        setAnalisisGeneradoEl(d.generadoEl)
        setAnalisisVigente(true)
      }
    }).catch(() => {})
  }, [])

  async function analizarInventario() {
    setLoadingAnalisis(true)
    setShowAnalisis(true)
    const res = await fetchApi('/api/inventario/analisis', { method: 'POST' })
    const d = await res.json()
    setAnalisis(d)
    setAnalisisGeneradoEl(new Date().toISOString())
    setAnalisisVigente(true)
    setLoadingAnalisis(false)
  }

  async function fetchProductos() {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await fetchApi('/api/inventario')
      if (data === null) {
        console.error('[inventario] fetchProductos: fetchApi devolvió null')
        setFetchError('Error al cargar inventario')
        setProductos([])
      } else {
        setProductos(Array.isArray(data) ? data : [])
      }
    } catch (e: any) {
      console.error('[inventario]', e)
      setFetchError(e.message || 'Error al cargar inventario')
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  async function guardarProducto() {
    setGuardando(true)
    if (modal === 'nuevo') {
      await fetchApi('/api/inventario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetchApi(`/api/inventario/${seleccionado.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setGuardando(false)
    setModal(null)
    fetchProductos()
  }

  async function guardarMovimiento() {
    setGuardando(true)
    await fetchApi(`/api/inventario/${seleccionado.id}/movimiento`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(movForm)
    })
    setGuardando(false)
    setModal(null)
    fetchProductos()
  }

  async function verHistorial(p: any) {
    setSeleccionado(p)
    const res = await fetchApi(`/api/inventario/${p.id}/movimiento`)
    setHistorial(await res.json())
    setModal('historial')
  }

  function abrirEditar(p: any) {
    setSeleccionado(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', costo: p.costo, precio: p.precio, stock: p.stock, stockMin: p.stockMin })
    setModal('editar')
  }

  function abrirMovimiento(p: any) {
    setSeleccionado(p)
    setMovForm({ tipo: 'entrada', cantidad: '', motivo: '' })
    setModal('movimiento')
  }

  async function cargarPreview(file: File) {
    setImportFile(file)
    setImportParsing(true)
    setImportResult(null)
    setImportPreview([])
    const fd = new FormData()
    fd.append('file', file)
    const data = await fetchApi('/api/inventario/importar?preview=1', { method: 'POST', body: fd })
    if (data === null || data.error) {
      setImportPreview([])
      setImportResult({ ok: false, text: data?.error ?? 'No se pudo leer el archivo.' })
    } else {
      setImportPreview(data.filas ?? [])
    }
    setImportParsing(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) cargarPreview(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) cargarPreview(file)
  }

  function resetImport() {
    setImportFile(null)
    setImportPreview([])
    setImportResult(null)
  }

  function closeImportModal() {
    setShowImportModal(false)
    resetImport()
  }

  async function confirmarImport() {
    if (!importFile) return
    setImportando(true)
    const fd = new FormData()
    fd.append('file', importFile)
    const data = await fetchApi('/api/inventario/importar', { method: 'POST', body: fd })
    if (data === null || data.error) {
      setImportResult({ ok: false, text: data?.error ?? 'Error al importar.' })
    } else {
      const partes = []
      if (data.creados > 0) partes.push(`${data.creados} creado${data.creados !== 1 ? 's' : ''}`)
      if (data.actualizados > 0) partes.push(`${data.actualizados} actualizado${data.actualizados !== 1 ? 's' : ''}`)
      setImportResult({ ok: true, text: partes.length ? partes.join(', ') + '.' : 'Sin cambios.' })
      resetImport()
      fetchProductos()
    }
    setImportando(false)
  }

  const stockBajo = productos.filter(p => p.activo && p.stock <= p.stockMin)

  return (
    <div className="space-y-6">
      {/* Modal Importar / Exportar */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900">
              <h2 className="text-white font-bold">📥 Importar / Exportar productos</h2>
              <button onClick={closeImportModal} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-6">

              {/* Sección exportar */}
              <div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Exportar</p>
                <a href="/api/inventario/exportar" download
                  className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-4 py-3 transition-colors cursor-pointer">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Descargar inventario completo</p>
                    <p className="text-zinc-400 text-xs mt-0.5">Excel con todos tus productos actuales. Úsalo como base para editar e importar.</p>
                  </div>
                </a>
              </div>

              <div className="border-t border-zinc-800" />

              {/* Sección importar */}
              <div className="space-y-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Importar desde Excel</p>
                <p className="text-zinc-500 text-xs">Columnas: <span className="text-zinc-400">Código · Nombre · Descripción · Costo · Precio · Stock · Stock Mínimo · Oferta</span></p>

                {/* Zona drag & drop */}
                {!importFile && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-600'}`}
                  >
                    <p className="text-zinc-400 text-sm mb-3">Arrastra un .xlsx aquí o</p>
                    <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                      Seleccionar archivo
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>
                )}

                {/* Parsing */}
                {importFile && importParsing && (
                  <div className="text-center py-8 text-zinc-400 text-sm">Analizando archivo...</div>
                )}

                {/* Preview */}
                {importFile && !importParsing && importPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium truncate max-w-[300px]">{importFile.name}</p>
                      <button onClick={resetImport} className="text-zinc-500 hover:text-white text-xs ml-2 flex-shrink-0">✕ Cambiar</button>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Válida</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Stock en 0</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Inválida</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-zinc-800">
                      <table className="w-full text-xs" style={{ minWidth: '600px' }}>
                        <thead>
                          <tr className="bg-zinc-800 text-zinc-400">
                            <th className="px-3 py-2 text-left font-medium">Código</th>
                            <th className="px-3 py-2 text-left font-medium">Nombre</th>
                            <th className="px-3 py-2 text-right font-medium">Precio</th>
                            <th className="px-3 py-2 text-right font-medium">Stock</th>
                            <th className="px-3 py-2 text-left font-medium">Oferta</th>
                            <th className="px-3 py-2 text-left font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row: any, i: number) => (
                            <tr key={i} className={`border-t border-zinc-800/50 ${row.status === 'invalid' ? 'bg-red-500/5' : row.status === 'warning' ? 'bg-yellow-500/5' : 'bg-emerald-500/5'}`}>
                              <td className="px-3 py-2 font-mono text-zinc-400">{row.codigo || '—'}</td>
                              <td className="px-3 py-2 text-white">{row.nombre || <span className="text-red-400 italic">Sin nombre</span>}</td>
                              <td className="px-3 py-2 text-right text-zinc-300">
                                {row.precio > 0 ? `$${Number(row.precio).toLocaleString('es-CO')}` : <span className="text-red-400">—</span>}
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold ${row.stock === 0 ? 'text-yellow-400' : 'text-white'}`}>{row.stock}</td>
                              <td className="px-3 py-2 text-zinc-400 max-w-[120px] truncate">{row.oferta || '—'}</td>
                              <td className="px-3 py-2">
                                {row.status === 'invalid' && <span className="text-red-400">{row.error}</span>}
                                {row.status === 'warning' && <span className="text-yellow-400">Stock en 0</span>}
                                {row.status === 'valid' && <span className="text-emerald-400">✓</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-4 text-xs text-zinc-500">
                      <span className="text-emerald-400 font-medium">{importPreview.filter((r: any) => r.status !== 'invalid').length} se importarán</span>
                      {importPreview.filter((r: any) => r.status === 'invalid').length > 0 && (
                        <span className="text-red-400">{importPreview.filter((r: any) => r.status === 'invalid').length} se omitirán</span>
                      )}
                    </div>
                    <button
                      onClick={confirmarImport}
                      disabled={importando || importPreview.filter((r: any) => r.status !== 'invalid').length === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors">
                      {importando ? '⏳ Importando...' : `✓ Confirmar importación (${importPreview.filter((r: any) => r.status !== 'invalid').length} filas)`}
                    </button>
                  </div>
                )}

                {/* Resultado */}
                {importResult && (
                  <div className={`text-sm px-4 py-3 rounded-xl border ${importResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {importResult.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal análisis IA */}
      {showAnalisis && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900">
              <div className="flex-1">
                <h2 className="text-white font-bold">🤖 Análisis de Inventario</h2>
                {analisisGeneradoEl && <p className="text-zinc-500 text-xs mt-0.5">Generado: {new Date(analisisGeneradoEl).toLocaleDateString('es-CO')}</p>}
              </div>
              <button onClick={analizarInventario} disabled={loadingAnalisis}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg mr-2">
                🔄 Nuevo
              </button>
              <button onClick={() => setShowAnalisis(false)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-5">
              {loadingAnalisis ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl animate-pulse">🧠</div>
                  <p className="text-zinc-400 text-sm">Analizando inventario...</p>
                </div>
              ) : analisis?.error ? (
                <p className="text-red-400 text-sm">{analisis.error}</p>
              ) : analisis && (
                <div className="space-y-5">
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-1">📋 Diagnóstico general</p>
                    <p className="text-white text-sm">{analisis.resumen}</p>
                  </div>
                  {analisis.alertas?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">🚨 Alertas</p>
                      {analisis.alertas.map((a: any, i: number) => (
                        <div key={i} className={`rounded-xl p-3 border ${a.nivel === 'critico' ? 'bg-red-900/30 border-red-800' : a.nivel === 'advertencia' ? 'bg-yellow-900/30 border-yellow-800' : 'bg-emerald-900/30 border-emerald-800'}`}>
                          <p className={`text-xs font-semibold ${a.nivel === 'critico' ? 'text-red-400' : a.nivel === 'advertencia' ? 'text-yellow-400' : 'text-emerald-400'}`}>{a.producto}</p>
                          <p className="text-zinc-300 text-xs mt-0.5">{a.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {analisis.reabastecimiento?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">📦 Sugerido reabastecimiento</p>
                      {analisis.reabastecimiento.map((r: any, i: number) => (
                        <div key={i} className="bg-zinc-800 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white text-xs font-semibold">{r.producto}</p>
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Pedir {r.unidadesSugeridas} uds</span>
                          </div>
                          <p className="text-zinc-400 text-xs">{r.razon}</p>
                          <p className="text-zinc-600 text-xs mt-1">Stock actual: {r.unidadesActuales} uds</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {analisis.productos_estrella?.length > 0 && (
                      <div className="bg-zinc-800 rounded-xl p-3">
                        <p className="text-emerald-400 text-xs font-semibold mb-2">⭐ Más vendidos</p>
                        {analisis.productos_estrella.map((p: string, i: number) => (
                          <p key={i} className="text-zinc-300 text-xs">• {p}</p>
                        ))}
                      </div>
                    )}
                    {analisis.productos_lentos?.length > 0 && (
                      <div className="bg-zinc-800 rounded-xl p-3">
                        <p className="text-yellow-400 text-xs font-semibold mb-2">🐢 Baja rotación</p>
                        {analisis.productos_lentos.map((p: string, i: number) => (
                          <p key={i} className="text-zinc-300 text-xs">• {p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  {analisis.datos?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">📊 Detalle por producto</p>
                      <table className="w-full text-xs">
                        <thead><tr className="text-zinc-500 border-b border-zinc-700">
                          <th className="text-left pb-2">Producto</th>
                          <th className="text-right pb-2">Stock</th>
                          <th className="text-right pb-2">30 días</th>
                          <th className="text-right pb-2">Días resto</th>
                        </tr></thead>
                        <tbody>
                          {analisis.datos.map((p: any, i: number) => (
                            <tr key={i} className="border-b border-zinc-800/50">
                              <td className="py-1.5 text-white truncate max-w-[100px]">{p.nombre}</td>
                              <td className={`py-1.5 text-right font-semibold ${p.estadoStock === 'agotado' ? 'text-red-400' : p.estadoStock === 'critico' ? 'text-yellow-400' : 'text-emerald-400'}`}>{p.stock}</td>
                              <td className="py-1.5 text-right text-zinc-400">{p.vendido30dias}</td>
                              <td className={`py-1.5 text-right ${p.diasStockRestante < 7 ? 'text-red-400' : p.diasStockRestante < 14 ? 'text-yellow-400' : 'text-zinc-400'}`}>{p.diasStockRestante === 999 ? '—' : p.diasStockRestante}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">📦 Inventario</h1>
        <p className="text-zinc-400 text-sm">Control de productos y stock</p>
        <div className="flex gap-2 justify-end flex-wrap">
          <button onClick={analisis ? () => setShowAnalisis(true) : analizarInventario}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            🤖 {analisis ? 'Ver análisis' : 'Analizar'}
          </button>
          <button onClick={() => setShowImportModal(true)}
            className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            📥 Importar / Exportar
          </button>
          <button onClick={() => { setForm({ nombre: '', descripcion: '', costo: '', precio: '', stock: '', stockMin: '3' }); setModal('nuevo') }}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Alertas stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm mb-2">⚠️ Stock bajo ({stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''})</p>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map(p => (
              <span key={p.id} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-lg">
                {p.nombre} — {p.stock} uds
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="border-b border-zinc-800">
                {['Código', 'Producto', 'Costo', 'Precio', 'Stock', 'Stock mín.', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-zinc-400 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center text-zinc-600 py-10">Cargando...</td></tr>}
              {!loading && fetchError && (
                <tr><td colSpan={7} className="py-10 px-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-red-400 font-semibold text-sm mb-1">Error al cargar inventario</p>
                    <p className="text-red-300 text-xs font-mono">{fetchError}</p>
                    <button onClick={fetchProductos} className="mt-3 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1.5 rounded-lg">Reintentar</button>
                  </div>
                </td></tr>
              )}
              {!loading && !fetchError && productos.filter(p => p.activo).length === 0 && (
                <tr><td colSpan={7} className="text-center text-zinc-600 text-sm py-10">Sin productos. Crea el primero.</td></tr>
              )}
              {!loading && !fetchError && productos.filter(p => p.activo).map(p => (
                <tr key={p.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{p.codigo}</td>
                  <td className="px-4 py-3">
                    <div className="text-white text-sm font-medium">{p.nombre}</div>
                    {p.descripcion && <div className="text-zinc-500 text-xs mt-0.5 truncate max-w-[200px]">{p.descripcion}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">${p.costo?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-emerald-400 text-sm font-medium">${p.precio?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${p.stock <= p.stockMin ? 'text-red-400' : p.stock <= p.stockMin * 2 ? 'text-yellow-400' : 'text-white'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-sm">{p.stockMin}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirMovimiento(p)} className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/20">± Stock</button>
                      <button onClick={() => verHistorial(p)} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-600">Historial</button>
                      <button onClick={() => abrirEditar(p)} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-600">Editar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nuevo/editar */}
      {(modal === 'nuevo' || modal === 'editar') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{modal === 'nuevo' ? '+ Nuevo producto' : 'Editar producto'}</h3>
              <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-zinc-400 text-xs mb-1 block">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Crema Facial SPF50"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-zinc-400 text-xs mb-1 block">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  placeholder="Descripción opcional"
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Costo</label>
                <input type="number" value={form.costo} onChange={e => setForm({...form, costo: e.target.value})}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Precio venta</label>
                <input type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
              </div>
              {modal === 'nuevo' && (
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Stock inicial</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    placeholder="0"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
                </div>
              )}
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Stock mínimo (alerta)</label>
                <input type="number" value={form.stockMin} onChange={e => setForm({...form, stockMin: e.target.value})}
                  placeholder="3"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <button onClick={guardarProducto} disabled={guardando || !form.nombre}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors">
              {guardando ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {modal === 'movimiento' && seleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">± Ajustar stock</h3>
              <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-sm">
              <span className="text-zinc-400">{seleccionado.nombre}</span>
              <span className="text-white font-bold ml-2">Stock actual: {seleccionado.stock}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMovForm({...movForm, tipo: 'entrada'})}
                className={`py-2 rounded-xl text-sm font-semibold border transition-colors ${movForm.tipo === 'entrada' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                ↑ Entrada
              </button>
              <button onClick={() => setMovForm({...movForm, tipo: 'salida'})}
                className={`py-2 rounded-xl text-sm font-semibold border transition-colors ${movForm.tipo === 'salida' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                ↓ Salida
              </button>
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Cantidad</label>
              <input type="number" value={movForm.cantidad} onChange={e => setMovForm({...movForm, cantidad: e.target.value})}
                placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Motivo</label>
              <input value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})}
                placeholder="Ej: Reabastecimiento, Ajuste..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            </div>
            <button onClick={guardarMovimiento} disabled={guardando || !movForm.cantidad}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
              {guardando ? 'Guardando...' : '✓ Aplicar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal historial */}
      {modal === 'historial' && seleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">📋 Historial — {seleccionado.nombre}</h3>
              <button onClick={() => setModal(null)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            {historial.length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Sin movimientos</p>}
            {historial.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${m.tipo === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {m.tipo === 'entrada' ? '↑' : '↓'} {m.tipo}
                  </span>
                  <span className="text-zinc-300 text-sm">{m.motivo || '—'}</span>
                  <div className="text-zinc-500 text-xs mt-1">{new Date(m.createdAt).toLocaleString('es-CO')}</div>
                </div>
                <span className={`text-lg font-bold ${m.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

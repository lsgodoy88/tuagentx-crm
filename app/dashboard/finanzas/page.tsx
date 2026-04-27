'use client'
import { useEffect, useState } from 'react'

export default function FinanzasPage() {
  const hoy = new Date()
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const [desde, setDesde] = useState(primerDia.toISOString().split('T')[0])
  const [hasta, setHasta] = useState(hoy.toISOString().split('T')[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [analisis, setAnalisis] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/finanzas?desde=${desde}&hasta=${hasta}`)
      setData(await res.json())
    } catch(e) { console.log('Error finanzas:', e) }
    setLoading(false)
  }

  async function analizarConIA() {
    if (!data) return
    setLoadingIA(true)
    setAnalisis('')
    try {
      const res = await fetch('/api/finanzas/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finanzas: data })
      })
      const d = await res.json()
      setAnalisis(d.analisis || 'No se pudo generar el análisis.')
    } catch(e) { setAnalisis('Error al conectar con el servidor.') }
    setLoadingIA(false)
  }

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

  const atajos = [
    { label: 'Este mes', fn: () => { const h = new Date(); setDesde(new Date(h.getFullYear(),h.getMonth(),1).toISOString().split('T')[0]); setHasta(h.toISOString().split('T')[0]) }},
    { label: 'Mes anterior', fn: () => { const h = new Date(); setDesde(new Date(h.getFullYear(),h.getMonth()-1,1).toISOString().split('T')[0]); setHasta(new Date(h.getFullYear(),h.getMonth(),0).toISOString().split('T')[0]) }},
    { label: 'Últimos 30 días', fn: () => { const h = new Date(); const d = new Date(); d.setDate(d.getDate()-30); setDesde(d.toISOString().split('T')[0]); setHasta(h.toISOString().split('T')[0]) }},
    { label: 'Este año', fn: () => { const h = new Date(); setDesde(`${h.getFullYear()}-01-01`); setHasta(h.toISOString().split('T')[0]) }},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">💰 Finanzas</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Control de caja y rentabilidad de tu negocio</p>
      </div>

      {/* Selector fechas */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500" />
        </div>
        <button onClick={cargar} disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl text-sm">
          {loading ? '⏳' : '📊 Calcular'}
        </button>
        {atajos.map(a => (
          <button key={a.label} onClick={a.fn}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-xl border border-zinc-700">
            {a.label}
          </button>
        ))}
      </div>

      {data && (
        <>
          {/* KPIs fila 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Ingresos', valor: fmt(data.resumen.ingresos), color: 'text-emerald-400', icon: '📈' },
              { label: 'Costo de ventas', valor: fmt(data.resumen.costoVentas), color: 'text-red-400', icon: '📦' },
              { label: 'Fletes', valor: fmt(data.resumen.totalFletes), color: 'text-yellow-400', icon: '🚚' },
              { label: 'Ganancia bruta', valor: fmt(data.resumen.gananciaBruta), color: data.resumen.gananciaBruta >= 0 ? 'text-emerald-400' : 'text-red-400', icon: '💵' },
            ].map(k => (
              <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-500 text-xs mb-2">{k.icon} {k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.valor}</p>
              </div>
            ))}
          </div>

          {/* KPIs fila 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Margen general', valor: `${data.resumen.margenGeneral}%`, color: data.resumen.margenGeneral >= 30 ? 'text-emerald-400' : data.resumen.margenGeneral >= 15 ? 'text-yellow-400' : 'text-red-400', icon: '📊' },
              { label: 'Total ventas', valor: String(data.resumen.totalVentas), color: 'text-white', icon: '🛒' },
              { label: 'Valor inventario', valor: fmt(data.valorInventario), color: 'text-blue-400', icon: '🏷️' },
              { label: 'Ticket promedio', valor: data.resumen.totalVentas > 0 ? fmt(data.resumen.ingresos / data.resumen.totalVentas) : '$0', color: 'text-purple-400', icon: '🎟️' },
            ].map(k => (
              <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-500 text-xs mb-2">{k.icon} {k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.valor}</p>
              </div>
            ))}
          </div>

          {/* Tablas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">🏆 Productos más rentables</h3>
              {data.ventasPorProducto.length === 0 ? (
                <p className="text-zinc-500 text-xs">Sin ventas despachadas en el período</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left pb-2">Producto</th>
                    <th className="text-right pb-2">Uds</th>
                    <th className="text-right pb-2">Ganancia</th>
                    <th className="text-right pb-2">Margen</th>
                  </tr></thead>
                  <tbody>
                    {data.ventasPorProducto.map((p: any) => (
                      <tr key={p.nombre} className="border-b border-zinc-800/50">
                        <td className="py-2 text-white truncate max-w-[120px]">{p.nombre}</td>
                        <td className="py-2 text-right text-zinc-400">{p.unidades}</td>
                        <td className="py-2 text-right text-emerald-400">{fmt(p.ganancia)}</td>
                        <td className={`py-2 text-right font-semibold ${p.margen >= 30 ? 'text-emerald-400' : p.margen >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>{p.margen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">⚠️ Productos con bajo margen</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left pb-2">Producto</th>
                  <th className="text-right pb-2">Costo</th>
                  <th className="text-right pb-2">Precio</th>
                  <th className="text-right pb-2">Margen</th>
                </tr></thead>
                <tbody>
                  {data.productosBajoMargen.slice(0, 8).map((p: any) => (
                    <tr key={p.nombre} className="border-b border-zinc-800/50">
                      <td className="py-2 text-white truncate max-w-[120px]">{p.nombre}</td>
                      <td className="py-2 text-right text-zinc-400">{fmt(p.costo)}</td>
                      <td className="py-2 text-right text-zinc-400">{fmt(p.precio)}</td>
                      <td className={`py-2 text-right font-semibold ${p.margen >= 30 ? 'text-emerald-400' : p.margen >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>{p.margen}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análisis IA finanzas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white font-semibold">🤖 Análisis financiero con IA</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Diagnóstico de rentabilidad y recomendaciones concretas</p>
              </div>
              <button onClick={analizarConIA} disabled={loadingIA}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                {loadingIA ? <><span className="animate-spin">⏳</span> Analizando...</> : '✨ Analizar con IA'}
              </button>
            </div>
            {analisis ? (
              <div className="bg-zinc-800 rounded-xl p-4 text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{analisis}</div>
            ) : !loadingIA && (
              <p className="text-zinc-600 text-xs text-center py-4">Presiona "Analizar con IA" para obtener recomendaciones basadas en tus finanzas</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

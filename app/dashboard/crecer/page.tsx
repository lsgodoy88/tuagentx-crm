'use client'
import { useState, useEffect } from 'react'

export default function CrecerPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [generadoEl, setGeneradoEl] = useState<string|null>(null)
  const [expiraEn, setExpiraEn] = useState<string|null>(null)
  const [loadingCache, setLoadingCache] = useState(true)

  useEffect(() => { cargarCache() }, [])

  async function cargarCache() {
    setLoadingCache(true)
    try {
      const res = await fetch('/api/crecer')
      const d = await res.json()
      if (d.cached && d.data) {
        setData(d.data)
        setGeneradoEl(d.generadoEl)
        setExpiraEn(d.expiraEn)
      }
    } catch(e) {}
    setLoadingCache(false)
  }

  async function analizar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/crecer', { method: 'POST' })
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setData(d)
      setGeneradoEl(new Date().toISOString())
      setExpiraEn(new Date(Date.now() + 7*24*60*60*1000).toISOString())
    } catch(e) { setError('Error de conexión') }
    setLoading(false)
  }

  const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">🚀 Crecer</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Descubre productos estrella y proveedores mayoristas para expandir tu negocio en Colombia</p>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-900/40 to-emerald-900/40 border border-purple-700/30 rounded-2xl p-8 text-center space-y-4">
        <div className="text-5xl">🧠</div>
        <h2 className="text-white text-xl font-bold">Análisis de mercado con IA</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          La IA analiza tu inventario, detecta tu nicho y busca en internet los 3 productos con mayor rotación en Colombia.
        </p>
        {generadoEl && (
          <div className="bg-zinc-800/60 rounded-xl px-4 py-2 inline-block">
            <p className="text-zinc-400 text-xs">Última búsqueda: <span className="text-white">{fmtFecha(generadoEl)}</span> · Válida hasta: <span className="text-emerald-400">{expiraEn ? fmtFecha(expiraEn) : '-'}</span></p>
          </div>
        )}
        <button onClick={analizar} disabled={loading || loadingCache || !!data}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all flex items-center gap-2 mx-auto">
          {loading ? <><span className="animate-spin inline-block">⏳</span> Buscando en el mercado...</> : <><span>✨</span> {data ? 'Búsqueda completada' : 'Buscar oportunidades'}</>}
        </button>
        {loading && <p className="text-zinc-500 text-xs animate-pulse">Buscando tendencias en Colombia... esto puede tomar unos segundos</p>}
        {data && !loading && <p className="text-zinc-500 text-xs">✅ Búsqueda vigente · Se actualizará automáticamente en 7 días</p>}
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

      {loadingCache && !data && <p className="text-zinc-500 text-sm text-center py-8">Cargando...</p>}

      {data && (
        <div className="space-y-6">
          {/* Nicho */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <p className="text-zinc-400 text-xs">Nicho detectado</p>
              <p className="text-white text-xl font-bold capitalize">{data.nicho}</p>
              {data.tendencia_general && <p className="text-zinc-400 text-sm mt-1">{data.tendencia_general}</p>}
            </div>
          </div>

          {/* Tarjetas */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">⭐ 3 Productos estrella recomendados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data.productos?.map((p: any, i: number) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-br from-purple-900/50 to-zinc-800 h-32 flex items-center justify-center text-6xl">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div>
                      <span className="text-purple-400 text-xs font-semibold uppercase tracking-wide">#{i+1} Estrella</span>
                      <h4 className="text-white font-bold text-base mt-1">{p.nombre}</h4>
                      <p className="text-zinc-400 text-xs mt-1">{p.descripcion}</p>
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-xl p-3">
                      <p className="text-emerald-400 text-xs font-semibold mb-1">📈 Por qué vende ahora</p>
                      <p className="text-zinc-300 text-xs">{p.por_que_vende}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-800 rounded-xl p-3 text-center">
                        <p className="text-zinc-500 text-xs">Mayorista</p>
                        <p className="text-yellow-400 font-bold text-xs mt-1">
                          ${p.precio_mayorista_min?.toLocaleString('es-CO')} — ${p.precio_mayorista_max?.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-3 text-center">
                        <p className="text-zinc-500 text-xs">Venta sugerida</p>
                        <p className="text-emerald-400 font-bold text-xs mt-1">${p.precio_venta_sugerido?.toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                    {p.precio_mayorista_max && p.precio_venta_sugerido && (
                      <p className="text-center text-zinc-500 text-xs">Margen estimado: <span className="text-purple-400 font-bold">{Math.round(((p.precio_venta_sugerido - p.precio_mayorista_max) / p.precio_venta_sugerido) * 100)}%</span></p>
                    )}
                    <div className="bg-zinc-800 rounded-xl p-3 space-y-1 mt-auto">
                      <p className="text-zinc-400 text-xs font-semibold">🏭 Dónde conseguirlo</p>
                      <p className="text-white text-xs font-medium">{p.proveedor_nombre}</p>
                      {p.proveedor_ciudad && <p className="text-zinc-500 text-xs">📍 {p.proveedor_ciudad}</p>}
                      {p.proveedor_contacto && <p className="text-zinc-400 text-xs">🔗 {p.proveedor_contacto}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { fetchApi, errorMsg } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const ESTADO_COLORS: Record<string, string> = {
  nueva:      'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  confirmada: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  despachada: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  entregada:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cancelada:  'bg-red-500/15 text-red-400 border-red-500/20',
}

const ESTADO_ICONS: Record<string, string> = {
  nueva: '🟡', confirmada: '🔵', despachada: '📦', entregada: '✅', cancelada: '❌'
}

export default function VentasPage() {
  const { data: session } = useSession()
  const [ventas, setVentas] = useState<any[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [popupVenta, setPopupVenta] = useState<any>(null)
  const [popupTipo, setPopupTipo] = useState<'confirmar'|'despachar'|'cancelar'|null>(null)
  const [guia, setGuia] = useState('')
  const [flete, setFlete] = useState('')
  const [transportadora, setTransportadora] = useState('Interrapidísimo')
  const [enviando, setEnviando] = useState(false)
  const [mostrarFactura, setMostrarFactura] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    fetchVentas()
    fetch('/api/empresa-config').then(r => r.json()).then(d => {
      if (d.fleteBase) setFlete(String(d.fleteBase))
    }).catch(() => {})
  }, [])

  async function fetchVentas() {
    setLoading(true)
    const data = await fetchApi('/api/ventas')
    if (Array.isArray(data)) setVentas(data)
    setLoading(false)
    window.dispatchEvent(new CustomEvent('refreshVentas'))
  }

  async function confirmarVenta() {
    if (!popupVenta) return
    setEnviando(true)
    await fetchApi('/api/ventas/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: popupVenta.id })
    })
    setPopupVenta(null)
    setPopupTipo(null)
    await fetchVentas()
    setEnviando(false)
  }

  async function cancelarVenta() {
    if (!popupVenta) return
    setCancelando(true)
    await fetchApi('/api/ventas/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: popupVenta.id, motivo: motivoCancelacion })
    })
    setCancelando(false)
    setPopupVenta(null)
    setPopupTipo(null)
    setMotivoCancelacion('')
    fetchVentas()
  }

  async function despacharLocal() {
    if (!popupVenta) return
    setEnviando(true)
    await fetchApi('/api/ventas/despachar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: popupVenta.id, guia: 'Local', transportadora: 'Despacho local', flete: Number(flete) || 0 })
    })
    setEnviando(false)
    setPopupVenta(null)
    setPopupTipo(null)
    fetchVentas()
    window.dispatchEvent(new CustomEvent('refreshVentas'))
  }

  async function despacharVenta() {
    if (!popupVenta || !guia) return
    setEnviando(true)
    await fetchApi('/api/ventas/despachar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: popupVenta.id, guia, transportadora })
    })
    setPopupVenta(null)
    setPopupTipo(null)
    setGuia('')
    await fetchVentas()
    setEnviando(false)
  }

  async function marcarEntregada(id: string) {
    await fetchApi(`/api/ventas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ estado: 'entregada' })
    })
    await fetchVentas()
  }

  const FILTROS = ['todos','nueva','confirmada','despachada','entregada','cancelada']
  const ventasFiltradas = filtro === 'todos' ? ventas : ventas.filter(v => v.estado === filtro)
  const nuevas = ventas.filter(v => v.estado === 'nueva').length

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Ventas
            {nuevas > 0 && <span className="bg-emerald-500 text-black text-sm font-bold px-2.5 py-0.5 rounded-full">{nuevas} nuevas</span>}
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">Gestión de pedidos y envíos</p>
        </div>
        <button onClick={fetchVentas} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">↻ Actualizar</button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors capitalize ${filtro === f ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:text-white bg-zinc-800'}`}>
            {f === 'todos' ? 'Todos' : `${ESTADO_ICONS[f]} ${f}`} {f !== 'todos' && `(${ventas.filter(v => v.estado === f).length})`}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl" style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table className="w-full" style={{minWidth:'800px'}}>
          <thead>
            <tr className="border-b border-zinc-800">
              {['ID Venta','Cliente','Producto','Ciudad','Dirección','Monto','Estado','Acción'].map(h => (
                <th key={h} className="text-left text-zinc-400 text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 && (
              <tr><td colSpan={7} className="text-center text-zinc-600 text-sm py-10">Sin ventas</td></tr>
            )}
            {ventasFiltradas.map(v => (
              <tr key={v.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 cursor-pointer" onClick={() => { setPopupVenta(v); setPopupTipo(null) }}>
                <td className="px-4 py-3 text-emerald-400 text-sm font-mono font-bold">{v.ventaId || '—'}</td>
                <td className="px-4 py-3 text-white text-sm font-medium">{v.cliente}</td>
                <td className="px-4 py-3 text-zinc-300 text-sm">{v.producto || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-sm">{v.ciudad || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-sm max-w-[160px] truncate">{v.direccion || '—'}</td>
                <td className="px-4 py-3 text-zinc-300 text-sm font-medium">{v.monto ? `$${v.monto.toLocaleString('es-CO')}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${ESTADO_COLORS[v.estado] || 'bg-zinc-700 text-zinc-300'}`}>
                    {ESTADO_ICONS[v.estado]} {v.estado}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {v.estado === 'nueva' && (
                    <button onClick={() => { setPopupVenta(v); setPopupTipo('confirmar') }}
                      className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/20 font-medium">
                      ✓ Confirmar
                    </button>
                  )}
                  {v.estado === 'confirmada' && (
                    <button onClick={() => { setPopupVenta(v); setPopupTipo('despachar') }}
                      className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs px-3 py-1.5 rounded-lg hover:bg-purple-500/20 font-medium">
                      📦 Despachar
                    </button>
                  )}
                  {v.estado === 'despachada' && (
                    <button onClick={() => marcarEntregada(v.id)}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 font-medium">
                      ✅ Entregada
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pop-up detalle / confirmar / despachar */}
      {popupVenta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setPopupVenta(null); setPopupTipo(null) }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>

            {/* Header popup */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{popupVenta.ventaId || 'Sin ID'}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${ESTADO_COLORS[popupVenta.estado]}`}>
                  {ESTADO_ICONS[popupVenta.estado]} {popupVenta.estado}
                </span>
              </div>
              <button onClick={() => { setPopupVenta(null); setPopupTipo(null) }} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>

            {/* Datos del cliente */}
            {popupTipo !== 'despachar' && (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Datos del pedido</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-zinc-500">Cliente:</span> <span className="text-white font-medium">{popupVenta.cliente}</span></div>
                <div><span className="text-zinc-500">Número:</span> <span className="text-white font-medium">{popupVenta.numero || '—'}</span></div>
                <div><span className="text-zinc-500">Producto:</span> <span className="text-white font-medium">{popupVenta.producto || '—'}</span></div>
                <div><span className="text-zinc-500">Ciudad:</span> <span className="text-white font-medium">{popupVenta.ciudad || '—'}</span></div>
                <div><span className="text-zinc-500">Monto:</span> <span className="text-emerald-400 font-bold">{popupVenta.monto ? `$${popupVenta.monto.toLocaleString('es-CO')}` : '—'}</span></div>
                <div><span className="text-zinc-500">Fecha:</span> <span className="text-white">{new Date(popupVenta.createdAt).toLocaleDateString('es-CO')}</span></div>
              </div>
              {popupVenta.cedula && (
                <div><span className="text-zinc-500">Cédula:</span> <span className="text-white font-medium">{popupVenta.cedula}</span></div>
              )}
              {popupVenta.direccion && (
                <div className="col-span-2"><span className="text-zinc-500">Dirección:</span> <span className="text-white font-medium">{popupVenta.direccion}</span></div>
              )}
              {popupVenta.observacion && (
                <div className="col-span-2"><span className="text-zinc-500">Observación:</span> <span className="text-white font-medium">{popupVenta.observacion}</span></div>
              )}
              {!popupVenta.direccion && (
                <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-yellow-400 text-xs">
                  ⚠️ Esperando dirección del cliente...
                </div>
              )}
              {popupVenta.resumen && (
                <div className="col-span-2 pt-2 border-t border-zinc-700">
                  <span className="text-zinc-500 text-xs">Resumen:</span>
                  <p className="text-zinc-300 text-xs mt-1">{popupVenta.resumen}</p>
                </div>
              )}
            </div>
            )}

            {/* Acción confirmar */}
            {popupTipo === 'confirmar' && (
              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-sm">
                  📱 Se enviará un WhatsApp al cliente confirmando su pedido.
                </div>
                <button onClick={confirmarVenta} disabled={enviando}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  {enviando ? 'Enviando...' : '✓ Confirmar y enviar mensaje'}
                </button>
              </div>
            )}

            {/* Acción despachar */}
            {popupTipo === 'despachar' && (
              <div className="space-y-4">
                {/* Botón generar factura */}
                <button onClick={() => window.open(`/api/ventas/${popupVenta.id}/proforma`, '_blank')}
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold py-2.5 rounded-xl hover:bg-emerald-500/20 transition-colors">
                  📄 Generar factura
                </button>

                {/* Separador */}
                <div className="text-zinc-500 text-xs text-center">— Selecciona tipo de despacho —</div>
                {/* Despacho local */}
                <button onClick={() => despacharLocal()}
                  disabled={enviando || !popupVenta.direccion}
                  className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold py-2.5 rounded-xl hover:bg-blue-500/20 disabled:opacity-50 transition-colors">
                  🏍️ Despacho local
                </button>
                {/* Transportadora */}
                <div className="space-y-2">
                  <select value={transportadora} onChange={e => setTransportadora(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl">
                    <option>Interrapidísimo</option>
                    <option>Coordinadora</option>
                    <option>Servientrega</option>
                    <option>Deprisa</option>
                    <option>TCC</option>
                    <option>Otra</option>
                  </select>
                  <input value={guia} onChange={e => setGuia(e.target.value)}
                    placeholder="Número de guía"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-purple-500" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <input type="number" value={flete || ''} onChange={e => setFlete(e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm pl-7 pr-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-purple-500" />
                    {flete && Number(flete) > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">{Number(flete).toLocaleString('es-CO')}</span>}
                  </div>
                  <button onClick={despacharVenta} disabled={enviando || !guia || !popupVenta.direccion}
                    className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                    {enviando ? 'Enviando...' : '🚚 Despachar con transportadora'}
                  </button>
                </div>
              </div>
            )}
            {!popupTipo && popupVenta.estado === 'nueva' && (
              <button onClick={() => setPopupTipo('confirmar')}
                className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold py-2.5 rounded-xl hover:bg-blue-500/20">
                ✓ Confirmar pedido
              </button>
            )}
            {!popupTipo && popupVenta.estado === 'confirmada' && (
              <button onClick={() => setPopupTipo('despachar')}
                className="w-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold py-2.5 rounded-xl hover:bg-purple-500/20">
                📦 Despachar pedido
              </button>
            )}
            {!popupTipo && (popupVenta.estado === 'confirmada' || popupVenta.estado === 'despachada') && (
              <button onClick={() => setPopupTipo('cancelar')}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-2.5 rounded-xl hover:bg-red-500/20">
                ❌ Cancelar pedido
              </button>
            )}
            {popupTipo === 'cancelar' && (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm">
                  ⚠️ Se notificará al cliente por WhatsApp.{popupVenta.estado === 'despachada' ? ' El stock será devuelto al inventario.' : ''}
                </div>
                <input value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-red-500" />
                <button onClick={cancelarVenta} disabled={cancelando}
                  className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  {cancelando ? 'Cancelando...' : '❌ Confirmar cancelación'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

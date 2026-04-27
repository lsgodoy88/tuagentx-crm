'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

function BarChart({ data, labelKey, valueKey, color = 'emerald' }: any) {
  const max = Math.max(...data.map((d: any) => d[valueKey]), 1)
  return (
    <div className="space-y-2">
      {data.map((d: any) => (
        <div key={d[labelKey]} className="flex items-center gap-3">
          <div className="text-zinc-400 text-xs">{d[labelKey]}{d.monto ? <span className="text-zinc-500 ml-1">${d.monto.toLocaleString('es-CO')}</span> : ''}</div>
          <div className="flex-1 bg-zinc-800 rounded-full h-2">
            <div className={`h-2 rounded-full bg-${color}-500`} style={{ width: `${(d[valueKey] / max) * 100}%` }} />
          </div>
          <div className="text-white text-xs w-6 text-right">{d[valueKey]}</div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data }: { data: { dia: string; cantidad: number }[] }) {
  const max = Math.max(...data.map(d => d.cantidad), 1)
  const w = 100 / (data.length - 1)
  const points = data.map((d, i) => `${i * w},${100 - (d.cantidad / max) * 80}`).join(' ')
  return (
    <div className="relative">
      <svg viewBox={`0 0 100 100`} className="w-full h-32" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <circle key={i} cx={i * w} cy={100 - (d.cantidad / max) * 80} r="1.5" fill="#10b981" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map(d => (
          <div key={d.dia} className="text-zinc-600 text-xs">{d.dia}</div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [stats, setStats] = useState<any>(null)
  const [resumenCRM, setResumenCRM] = useState<any>(null)
  const [detalleCRM, setDetalleCRM] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    if (user?.role === 'admin') {
      fetch('/api/precios').then(r => r.json()).then(d => setResumenCRM(d)).catch(() => {})
    }
  }, [user])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {user?.role === 'admin' ? 'Panel de administración' : `Bienvenido, ${user?.name}`}
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          {user?.role === 'admin' ? 'Vista general del sistema' : 'Resumen de tu cuenta'}
        </p>
      </div>

      {/* Resumen financiero — solo admin */}
      {user?.role === 'admin' && resumenCRM && (
        <div className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-emerald-400 font-semibold">💰 Facturación mensual CRM</p>
              <p className="text-zinc-400 text-xs mt-0.5">{resumenCRM.resumenEmpresas?.length || 0} empresa{resumenCRM.resumenEmpresas?.length !== 1 ? 's' : ''} activa{resumenCRM.resumenEmpresas?.length !== 1 ? 's' : ''}</p>
            </div>
            <p className="text-emerald-400 font-bold text-xl">${(resumenCRM.resumenEmpresas?.reduce((a: number, e: any) => a + e.total, 0) || 0).toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-white font-semibold text-sm">Por empresa</p>
            </div>
            {(resumenCRM.resumenEmpresas || []).map((e: any) => (
              <div key={e.id}>
                <button onClick={() => setDetalleCRM(detalleCRM === e.id ? null : e.id)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏢</span>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">{e.nombre}</p>
                      <p className="text-zinc-500 text-xs">{e.bots} bot{e.bots !== 1 ? 's' : ''} activo{e.bots !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">${e.total.toLocaleString('es-CO')}</p>
                    <span className="text-zinc-500 text-xs">{detalleCRM === e.id ? '▲' : '▼'}</span>
                  </div>
                </button>
                {detalleCRM === e.id && (
                  <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800 space-y-2">
                    {(e.funcionalidades || []).map((f: any) => (
                      <div key={f.codigo} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">{f.codigo === 'agente' ? '🤖' : f.codigo === 'posventa' ? '📦' : '📅'} {f.nombre}</span>
                        <span className="text-white">${f.precio.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-zinc-300">Total mensual</span>
                      <span className="text-emerald-400">${e.total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ventas hoy', value: stats?.ventasHoy ?? 0, icon: '💰' },
          { label: 'Últimos 7 días', value: stats?.ventas7dias ?? 0, icon: '📈' },
          { label: 'Últimos 30 días', value: stats?.ventas30dias ?? 0, icon: '📅' },
          { label: 'Total ventas', value: stats?.totalVentas ?? 0, icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-zinc-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfica ventas 7 días */}
      {stats?.ventasPorDia?.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">📊 Ventas últimos 7 días</h2>
          <LineChart data={stats.ventasPorDia} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top productos */}
        {stats?.topProductos?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">🛍️ Top productos</h2>
            <BarChart data={stats.topProductos} labelKey="nombre" valueKey="cantidad" color="emerald" />
          </div>
        )}

        {/* Top ciudades */}
        {stats?.topCiudades?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-sm">📍 Ventas por ciudad</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth:'400px'}}>
              <thead><tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Ciudad</th>
                <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Unidades</th>
                <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Total</th>
              </tr></thead>
              <tbody>
                {stats.topCiudades.map((c: any) => (
                  <tr key={c.ciudad} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-white text-sm">{c.ciudad}</td>
                    <td className="px-5 py-3 text-zinc-300 text-sm text-right">{c.cantidad}</td>
                    <td className="px-5 py-3 text-blue-400 text-sm text-right font-medium">${c.monto?.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Por agente */}
        {stats?.ventasPorBot?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-sm">🤖 Ventas por agente</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full" style={{minWidth:'400px'}}>
              <thead><tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Agente</th>
                <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Unidades</th>
                <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Total</th>
              </tr></thead>
              <tbody>
                {stats.ventasPorBot.map((b: any) => (
                  <tr key={b.instance} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-white text-sm font-mono">{b.instance}</td>
                    <td className="px-5 py-3 text-zinc-300 text-sm text-right">{b.cantidad}</td>
                    <td className="px-5 py-3 text-amber-400 text-sm text-right font-medium">${b.monto?.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Por mes */}
        {stats?.ventasPorMes?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold text-sm">📆 Ventas por mes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" style={{minWidth:'500px'}}>
                <thead><tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-400 text-xs font-medium px-5 py-3">Mes</th>
                  {stats.bots?.map((b: string) => (
                    <th key={b} className="text-right text-zinc-400 text-xs font-medium px-3 py-3">{b}</th>
                  ))}
                  <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Total uds</th>
                  <th className="text-right text-zinc-400 text-xs font-medium px-5 py-3">Total $</th>
                </tr></thead>
                <tbody>
                  {stats.ventasPorMes.map((m: any) => (
                    <tr key={m.mes} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                      <td className="px-5 py-3 text-white text-sm capitalize">{m.mes}</td>
                      {stats.bots?.map((b: string) => (
                        <td key={b} className="px-3 py-3 text-zinc-400 text-sm text-right">{m[b]?.cantidad || 0}</td>
                      ))}
                      <td className="px-5 py-3 text-purple-400 text-sm text-right font-medium">{m.total}</td>
                      <td className="px-5 py-3 text-emerald-400 text-sm text-right font-medium">${m.monto?.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Por empresa — solo admin */}
      {user?.role === 'admin' && stats?.ventasPorEmpresa?.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">🏢 Ventas por empresa</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Empresa','Este mes','Total'].map(h => (
                  <th key={h} className="text-left text-zinc-400 text-xs font-medium py-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.ventasPorEmpresa.map((e: any) => (
                <tr key={e.nombre} className="border-b border-zinc-800 last:border-0">
                  <td className="py-2 px-3 text-white text-sm">{e.nombre}</td>
                  <td className="py-2 px-3 text-emerald-400 text-sm font-semibold">{e.mes}</td>
                  <td className="py-2 px-3 text-zinc-400 text-sm">{e.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

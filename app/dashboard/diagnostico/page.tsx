'use client'
import { fetchApi } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DiagnosticoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [incidentes, setIncidentes] = useState<any[]>([])
  const [botLogs, setBotLogs] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [buscarAudit, setBuscarAudit] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'incidentes'|'logs'|'sistema'|'apis'|'auditoria'>('incidentes')
  const [sistema, setSistema] = useState<any>(null)
  const [loadingSistema, setLoadingSistema] = useState(false)
  const [apis, setApis] = useState<any>(null)
  const [loadingApis, setLoadingApis] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') { router.push('/dashboard'); return }
    fetchData()
  }, [user])

  async function verificarYActualizar() {
    setLoading(true)
    await fetchApi('/api/diagnostico/verificar', { method: 'POST' })
    await fetchData()
  }

  async function fetchApis() {
    setLoadingApis(true)
    const res = await fetchApi('/api/diagnostico/apis')
    const data = await res.json()
    setApis(data)
    setLoadingApis(false)
  }

  async function fetchSistema() {
    setLoadingSistema(true)
    const res = await fetchApi('/api/diagnostico/sistema')
    const data = await res.json()
    setSistema(data)
    setLoadingSistema(false)
  }

  async function fetchData() {
    setLoading(true)
    const res = await fetchApi('/api/diagnostico')
    if (res.ok) {
      const data = await res.json()
      setAuditLogs(data.auditLogs || [])
      setIncidentes(data.incidentes || [])
      setBotLogs(data.botLogs || [])
      // Notificar al sidebar
      window.dispatchEvent(new CustomEvent('refreshIncidentes'))
    }
    setLoading(false)
  }

  function duracion(inicio: string, fin: string | null) {
    if (!fin) return 'En curso'
    const ms = new Date(fin).getTime() - new Date(inicio).getTime()
    const min = Math.floor(ms / 60000)
    if (min < 60) return `${min} min`
    return `${Math.floor(min/60)}h ${min%60}m`
  }

  const activos = incidentes.filter(i => !i.resuelto)

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnóstico</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Historial de incidentes y actividad del sistema</p>
        </div>
        <button onClick={verificarYActualizar} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">↻ Actualizar</button>
      </div>

      {/* Alertas activas */}
      {activos.length > 0 && (
        <div className="space-y-2">
          {activos.map(i => (
            <div key={i.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-2xl">🚨</span>
              <div className="flex-1">
                <div className="text-red-400 font-semibold">{i.servicio} — CAÍDO</div>
                <div className="text-red-300/70 text-sm">{i.error}</div>
                <div className="text-zinc-500 text-xs mt-1">Desde: {new Date(i.inicio).toLocaleString('es-CO')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activos.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="text-emerald-400 font-semibold">Todos los servicios funcionando correctamente</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['incidentes', 'logs', 'sistema', 'apis', 'auditoria'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === t ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
            {t === 'incidentes' ? `🚨 Incidentes (${incidentes.length})` : t === 'logs' ? `📋 Agente Logs (${botLogs.length})` : t === 'sistema' ? '🖥️ Sistema' : t === 'apis' ? '💳 APIs' : `🔍 Auditoría (${auditLogs.length})`}
          </button>
        ))}
      </div>

      {/* Incidentes */}
      {tab === 'incidentes' && (
        <div className="overflow-x-auto rounded-2xl"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden min-w-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Servicio','Error','Inicio','Duración','Estado'].map(h => (
                  <th key={h} className="text-left text-zinc-400 text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidentes.length === 0 && (
                <tr><td colSpan={5} className="text-center text-zinc-600 text-sm py-8">Sin incidentes registrados</td></tr>
              )}
              {incidentes.map(i => (
                <tr key={i.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-5 py-3 text-white text-sm font-medium">{i.servicio}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs max-w-xs truncate">{i.error}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(i.inicio).toLocaleString('es-CO')}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{duracion(i.inicio, i.fin)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${i.resuelto ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {i.resuelto ? '✓ Resuelto' : '● Activo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {/* Agente Logs */}
      {tab === 'sistema' && (
        <div className="space-y-4">
          <button onClick={fetchSistema} disabled={loadingSistema}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl text-sm">
            {loadingSistema ? '⏳ Analizando...' : '🔍 Analizar sistema'}
          </button>
          {sistema && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPU y Memoria */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm">🖥️ Servidor</h3>
                <div className="text-zinc-400 text-xs space-y-2">
                  <div className="flex justify-between"><span>Uptime</span><span className="text-emerald-400">{sistema.uptime}</span></div>
                  <div className="flex justify-between"><span>CPU uso</span>
                    <span className={sistema.cpu?.uso > 80 ? 'text-red-400' : sistema.cpu?.uso > 50 ? 'text-yellow-400' : 'text-emerald-400'}>{sistema.cpu?.uso}%</span>
                  </div>
                  <div className="flex justify-between"><span>RAM usada</span>
                    <span className={sistema.memoria?.porcentaje > 85 ? 'text-red-400' : sistema.memoria?.porcentaje > 65 ? 'text-yellow-400' : 'text-emerald-400'}>
                      {sistema.memoria?.usada}MB / {sistema.memoria?.total}MB ({sistema.memoria?.porcentaje}%)
                    </span>
                  </div>
                  <div className="flex justify-between"><span>Disco /srv</span>
                    <span className={sistema.disco?.porcentaje > '85%' ? 'text-red-400' : 'text-emerald-400'}>{sistema.disco?.usado} / {sistema.disco?.total} ({sistema.disco?.porcentaje})</span>
                  </div>
                </div>
              </div>
              {/* Redis */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm">⚡ Redis / BD</h3>
                <div className="text-zinc-400 text-xs space-y-2">
                  <div className="flex justify-between"><span>Redis memoria</span><span className="text-emerald-400">{sistema.redis?.memoria}</span></div>
                  <div className="flex justify-between"><span>Redis keys</span><span className="text-white">{sistema.redis?.keys}</span></div>
                  <div className="flex justify-between"><span>BD latencia</span>
                    <span className={sistema.dbLatencia > 100 ? 'text-yellow-400' : 'text-emerald-400'}>{sistema.dbLatencia}ms</span>
                  </div>
                </div>
              </div>
              {/* PM2 */}
              {sistema.pm2 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-white font-semibold text-sm">🔄 Procesos PM2</h3>
                  {sistema.pm2.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <span className="text-white font-mono">{p.name}</span>
                      <div className="flex gap-3 text-zinc-400">
                        <span className={p.status === 'online' ? 'text-emerald-400' : 'text-red-400'}>{p.status}</span>
                        <span>RAM: {p.memoria}MB</span>
                        <span>CPU: {p.cpu}%</span>
                        <span>Reinicios: {p.restarts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Registros BD */}
              {sistema.registros && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-white font-semibold text-sm">📊 Registros en BD</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(sistema.registros).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-zinc-400">
                        <span className="capitalize">{k}</span>
                        <span className="text-white font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Tablas BD */}
              {sistema.tablas?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 md:col-span-2">
                  <h3 className="text-white font-semibold text-sm">🗄️ Tamaño tablas BD</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {sistema.tablas.map((t: any) => (
                      <div key={t.tablename} className="flex justify-between text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2">
                        <span className="truncate">{t.tablename}</span>
                        <span className="text-white ml-2 shrink-0">{t.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'auditoria' && (
        <div className="space-y-3">
          <input value={buscarAudit} onChange={e => setBuscarAudit(e.target.value)}
            placeholder="Buscar por acción, usuario..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left">
                  <th className="text-zinc-400 font-medium pb-2 pr-4">Fecha</th>
                  <th className="text-zinc-400 font-medium pb-2 pr-4">Acción</th>
                  <th className="text-zinc-400 font-medium pb-2 pr-4">Usuario</th>
                  <th className="text-zinc-400 font-medium pb-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs
                  .filter(a => !buscarAudit || a.accion?.toLowerCase().includes(buscarAudit.toLowerCase()) || a.usuario?.toLowerCase().includes(buscarAudit.toLowerCase()) || a.detalle?.toLowerCase().includes(buscarAudit.toLowerCase()))
                  .map((a: any) => (
                  <tr key={a.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-2 pr-4 text-zinc-400 text-xs whitespace-nowrap">{new Date(a.createdAt).toLocaleString('es-CO', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    <td className="py-2 pr-4">
                      <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (a.accion.includes('ERROR') ? "bg-red-500/20 text-red-400" : a.accion.includes('ELIMINADA') ? "bg-red-500/20 text-red-400" : a.accion.includes('CREADA') ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400")}>
                        {a.accion}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-zinc-300 text-xs">{a.usuario || '—'}</td>
                    <td className="py-2 text-zinc-400 text-xs max-w-xs truncate">{a.detalle || '—'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-zinc-600 text-sm py-8">Sin registros de auditoría aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === 'apis' && (
        <div className="space-y-4">
          <button onClick={fetchApis} disabled={loadingApis}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl text-sm">
            {loadingApis ? '⏳ Calculando...' : '💳 Calcular consumo'}
          </button>
          {apis && (
            <div className="space-y-4">
              {/* Mes actual */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm">📅 Este mes — {apis.modelo}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Mensajes', valor: apis.mes.mensajes, color: 'text-white' },
                    { label: 'Tokens entrada', valor: apis.mes.tokensIn.toLocaleString('es-CO'), color: 'text-blue-400' },
                    { label: 'Tokens salida', valor: apis.mes.tokensOut.toLocaleString('es-CO'), color: 'text-purple-400' },
                    { label: 'Total tokens', valor: apis.mes.totalTokens.toLocaleString('es-CO'), color: 'text-yellow-400' },
                  ].map(k => (
                    <div key={k.label} className="bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-zinc-500 text-xs mb-1">{k.label}</p>
                      <p className={`font-bold text-sm ${k.color}`}>{k.valor}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-xs mb-1">Costo estimado mes (USD)</p>
                    <p className="text-emerald-400 font-bold text-2xl">${apis.mes.costoUSD}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-xs mb-1">Costo estimado mes (COP)</p>
                    <p className="text-emerald-400 font-bold text-2xl">${apis.mes.costoCOP.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>
              {/* Histórico */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-semibold text-sm">📊 Histórico total</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-xs mb-1">Costo histórico (USD)</p>
                    <p className="text-yellow-400 font-bold text-xl">${apis.historico.costoUSD}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-zinc-500 text-xs mb-1">Costo histórico (COP)</p>
                    <p className="text-yellow-400 font-bold text-xl">${apis.historico.costoCOP.toLocaleString('es-CO')}</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-xs">Tarifas: entrada ${apis.tarifas.inputPer1M}/1M tokens · salida ${apis.tarifas.outputPer1M}/1M tokens · TRM ${apis.tarifas.trm.toLocaleString('es-CO')}</p>
              </div>
              {/* Por instancia */}
              {Object.keys(apis.porInstancia).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-white font-semibold text-sm">🤖 Consumo por agente (este mes)</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="text-left pb-2">Instancia</th>
                      <th className="text-right pb-2">Mensajes</th>
                      <th className="text-right pb-2">Tokens entrada</th>
                      <th className="text-right pb-2">Tokens salida</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(apis.porInstancia).map(([inst, d]: any) => (
                        <tr key={inst} className="border-b border-zinc-800/50">
                          <td className="py-2 text-white font-mono">{inst}</td>
                          <td className="py-2 text-right text-zinc-400">{d.mensajes}</td>
                          <td className="py-2 text-right text-blue-400">{d.tokensIn.toLocaleString('es-CO')}</td>
                          <td className="py-2 text-right text-purple-400">{d.tokensOut.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="overflow-x-auto rounded-2xl"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden min-w-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Instancia','Evento','Estado','Tiempo','Fecha'].map(h => (
                  <th key={h} className="text-left text-zinc-400 text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {botLogs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-zinc-600 text-sm py-8">Sin logs registrados</td></tr>
              )}
              {botLogs.map(l => (
                <tr key={l.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-5 py-3 text-white text-xs font-mono">{l.instance}</td>
                  <td className="px-5 py-3 text-zinc-300 text-xs">{l.evento}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.estado === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {l.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{l.ms ? `${l.ms}ms` : '—'}</td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{new Date(l.createdAt).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
    </div>
  )
}

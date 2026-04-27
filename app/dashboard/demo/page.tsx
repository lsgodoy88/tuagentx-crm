'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
type Comportamiento = {
  id: string; trigger: string; tipo: string; respuesta?: string
  accion?: string; activo: boolean; prioridad: number; createdAt: string
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
const ESTADO_COLORES: Record<string, string> = {
  NUEVO:      'bg-zinc-700 text-zinc-200',
  INTERESADO: 'bg-blue-500/20 text-blue-300',
  DEMO:       'bg-violet-500/20 text-violet-300',
  CLIENTE:    'bg-emerald-500/20 text-emerald-300',
  MOLESTO:    'bg-red-500/20 text-red-300',
  SOPORTE:    'bg-amber-500/20 text-amber-300',
  FRIO:       'bg-slate-500/20 text-slate-300',
}
const TIPO_COLORES: Record<string, string> = {
  PALABRA_CLAVE: 'bg-blue-500/20 text-blue-300',
  INTENCION:     'bg-violet-500/20 text-violet-300',
  ESTADO:        'bg-amber-500/20 text-amber-300',
}
const ESTADOS = ['NUEVO','INTERESADO','DEMO','CLIENTE','MOLESTO','SOPORTE','FRIO']

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLORES[estado] || 'bg-zinc-700 text-zinc-300'}`}>
      {estado}
    </span>
  )
}

// ─── Tab Demo (tarjeta) ──────────────────────────────────────────────────────
function TabDemo() {
  const router = useRouter()
  const [botConectado, setBotConectado] = useState(false)
  const [botNumero, setBotNumero] = useState<string|null>(null)
  const [botActivo, setBotActivo] = useState(true)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/demo/bot').then(r => r.json()).then(d => {
      setBotConectado(d.conectado || false)
      setBotNumero(d.numero || null)
      if (d.activo !== undefined) setBotActivo(d.activo)
    }).catch(() => {})
    fetch('/api/demo').then(r => r.json()).then(d => {
      setLeads(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const hoy = leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length
  const semana = leads.filter(l => (Date.now() - new Date(l.createdAt).getTime()) < 7*86400000).length
  const unicos = new Set(leads.map((l:any) => l.numero).filter(Boolean)).size
  const stats = [
    { label: 'Total leads', value: leads.length, icon: '👥' },
    { label: 'Hoy', value: hoy, icon: '📅' },
    { label: 'Esta semana', value: semana, icon: '📆' },
    { label: 'Numeros unicos', value: unicos, icon: '📱' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold mb-1">Agente Demo</div>
            <div className="flex items-center gap-3">
              <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (botConectado ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>
                {botConectado ? "● WhatsApp conectado" : "○ Desconectado"}
              </span>
              {botNumero && <span className="text-emerald-400 text-sm font-mono">+{botNumero}</span>}
            </div>
          </div>
          <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (botActivo ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700")}>
            {botActivo ? "Activo" : "Pausado"}
          </span>
        </div>
        <button onClick={() => router.push('/dashboard/demo/configurar')}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors">
          Editar configuracion
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-zinc-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-sm">Contactos captados</h2>
          <a href="/api/demo/export" className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg">Exportar Excel</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              {['Numero','Producto','Fecha'].map(h => (
                <th key={h} className="text-left text-zinc-400 text-xs font-medium px-6 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {leads.map((l:any) => (
                <tr key={l.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-6 py-3">
                    {l.numero ? <a href={"https://wa.me/" + l.numero} target="_blank" className="text-emerald-400 text-sm font-mono hover:underline">+{l.numero}</a>
                      : <span className="text-zinc-600 text-sm">-</span>}
                  </td>
                  <td className="px-6 py-3"><div className="text-white text-sm">{l.producto}</div></td>
                  <td className="px-6 py-3"><div className="text-zinc-300 text-xs">{new Date(l.createdAt).toLocaleDateString('es-CO')}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
// ─── Modal Comportamiento ─────────────────────────────────────────────────────
function ModalComportamiento({ inicial, onClose, onSave, onDelete }: {
  inicial?: Partial<Comportamiento>
  onClose: () => void
  onSave: (data: any) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    trigger:   inicial?.trigger   || '',
    tipo:      inicial?.tipo      || 'PALABRA_CLAVE',
    respuesta: inicial?.respuesta || '',
    accion:    inicial?.accion    || '',
    prioridad: inicial?.prioridad ?? 0,
    activo:    inicial?.activo    !== false,
  })
  const [guardando, setGuardando] = useState(false)

  async function submit() {
    if (!form.trigger.trim()) return
    setGuardando(true)
    await onSave(form)
    setGuardando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{inicial?.id ? 'Editar' : 'Nuevo'} comportamiento</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-zinc-400 text-xs mb-1 block">Trigger *</label>
            <input value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})}
              placeholder="precio / INSATISFECHO / INTERESADO"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
              <option value="PALABRA_CLAVE">PALABRA_CLAVE</option>
              <option value="INTENCION">INTENCION</option>
              <option value="ESTADO">ESTADO</option>
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Acción</label>
            <select value={form.accion} onChange={e => setForm({...form, accion: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
              <option value="">— Sin acción —</option>
              {ESTADOS.map(e => <option key={e} value={`CAMBIAR_ESTADO:${e}`}>→ Estado: {e}</option>)}
              <option value="ESCALAR">ESCALAR a humano</option>
            </select>
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Prioridad</label>
            <input type="number" min={0} max={100} value={form.prioridad}
              onChange={e => setForm({...form, prioridad: parseInt(e.target.value) || 0})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="activo-cb" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})}
              className="accent-emerald-500" />
            <label htmlFor="activo-cb" className="text-zinc-300 text-sm">Activo</label>
          </div>
          <div className="col-span-2">
            <label className="text-zinc-400 text-xs mb-1 block">Respuesta del agente (opcional)</label>
            <textarea value={form.respuesta} onChange={e => setForm({...form, respuesta: e.target.value})}
              rows={4} placeholder="Si no hay respuesta, Claude genera una automáticamente según el contexto..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            {onDelete && (
              <button onClick={onDelete}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg">Cancelar</button>
            <button onClick={submit} disabled={guardando || !form.trigger.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Comportamientos ──────────────────────────────────────────────────────
function TabComportamientos() {
  const [lista, setLista] = useState<Comportamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editando?: Comportamiento }>({ open: false })
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try { const d = await fetch('/api/bot-comportamientos').then(r => r.json()); setLista(Array.isArray(d) ? d : []) }
    catch(e) { console.log(e) }
    setLoading(false)
  }

  async function crear(data: any) {
    await fetch('/api/bot-comportamientos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    cargar()
  }

  async function editar(id: string, data: any) {
    await fetch(`/api/bot-comportamientos/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este comportamiento?')) return
    await fetch(`/api/bot-comportamientos/${id}`, { method: 'DELETE' })
    cargar()
  }

  async function toggleActivo(c: Comportamiento) {
    await fetch(`/api/bot-comportamientos/${c.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ activo: !c.activo }) })
    setLista(prev => prev.map(x => x.id === c.id ? { ...x, activo: !x.activo } : x))
  }

  async function seed() {
    setSeeding(true)
    const d = await fetch('/api/bot-comportamientos/seed', { method: 'POST' }).then(r => r.json())
    setSeeding(false)
    if (d.ok) cargar()
    else alert(d.mensaje || 'Ya existen comportamientos')
  }

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="space-y-4">
      {modal.open && (
        <ModalComportamiento
          inicial={modal.editando}
          onClose={() => setModal({ open: false })}
          onSave={data => modal.editando ? editar(modal.editando!.id, data) : crear(data)}
          onDelete={modal.editando ? async () => {
            if (!confirm('¿Eliminar este comportamiento?')) return
            await fetch(`/api/bot-comportamientos/${modal.editando!.id}`, { method: 'DELETE' })
            setModal({ open: false })
            cargar()
          } : undefined}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Comportamientos del agente</div>
          <div className="text-zinc-500 text-xs mt-0.5">Triggers que definen cómo responde Sofía (TuAgentX_bot)</div>
        </div>
        <div className="flex gap-2">
          <button onClick={seed} disabled={seeding}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg">
            {seeding ? 'Cargando...' : '🌱 Seed default'}
          </button>
          <button onClick={() => setModal({ open: true })}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3 py-1.5 rounded-lg">
            + Nuevo
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500">
          No hay comportamientos configurados. <button onClick={seed} className="text-emerald-400 hover:underline">Cargar defaults</button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              {['Tipo','Trigger','Respuesta / Acción','Prio','Activo',''].map(h => (
                <th key={h} className="text-left text-zinc-400 text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TIPO_COLORES[c.tipo] || 'bg-zinc-700 text-zinc-300'}`}>{c.tipo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-white text-sm font-mono">{c.trigger}</td>
                  <td className="px-4 py-2.5 max-w-xs">
                    {c.respuesta && <div className="text-zinc-300 text-xs line-clamp-1">{c.respuesta}</div>}
                    {c.accion    && <div className="text-amber-400 text-xs mt-0.5">{c.accion}</div>}
                    {!c.respuesta && !c.accion && <span className="text-zinc-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 text-sm">{c.prioridad}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleActivo(c)}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                      {c.activo ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => setModal({ open: true, editando: c })}
                        className="text-zinc-400 hover:text-white text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">✏️</button>
                      <button onClick={() => eliminar(c.id)}
                        className="text-zinc-400 hover:text-red-400 text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Estados ─────────────────────────────────────────────────────────────
function TabEstados() {
  const [comportamientos, setComportamientos] = useState<Comportamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Comportamiento | null>(null)
  const [modal, setModal] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const d = await fetch('/api/bot-comportamientos').then(r => r.json())
      setComportamientos(Array.isArray(d) ? d.filter((c: Comportamiento) => c.tipo === 'ESTADO') : [])
    } catch(e) { console.log(e) }
    setLoading(false)
  }

  async function editar(id: string, data: any) {
    await fetch(`/api/bot-comportamientos/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    cargar()
  }

  async function crear(data: any) {
    await fetch('/api/bot-comportamientos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...data, tipo: 'ESTADO' }) })
    cargar()
  }

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="space-y-4">
      {modal && (
        <ModalComportamiento
          inicial={{ tipo: 'ESTADO', ...(editando || {}) }}
          onClose={() => { setModal(false); setEditando(null) }}
          onSave={data => editando ? editar(editando.id, data) : crear(data)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Comportamiento por estado</div>
          <div className="text-zinc-500 text-xs mt-0.5">Define cómo responde el agente cuando el contacto está en cada estado</div>
        </div>
        <button onClick={() => { setEditando(null); setModal(true) }}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3 py-1.5 rounded-lg">
          + Nuevo estado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ESTADOS.map(estado => {
          const comp = comportamientos.filter(c => c.trigger === estado)
          return (
            <div key={estado} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <EstadoBadge estado={estado} />
                <button onClick={() => { setEditando(comp[0] || null); setModal(true) }}
                  className="text-zinc-500 hover:text-white text-xs">
                  {comp[0] ? '✏️ Editar' : '+ Agregar'}
                </button>
              </div>
              {comp.length === 0 ? (
                <div className="text-zinc-600 text-xs italic">Sin instrucciones específicas — usa el prompt base de Claude</div>
              ) : comp.map(c => (
                <div key={c.id} className="space-y-1">
                  {c.respuesta && <p className="text-zinc-300 text-xs leading-relaxed line-clamp-3">{c.respuesta}</p>}
                  {c.accion    && <p className="text-amber-400 text-xs">⚡ {c.accion}</p>}
                  <div className={`inline-block text-xs px-1.5 py-0.5 rounded ${c.activo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ─── Tab Bots (Simulador) ─────────────────────────────────────────────────────
function TabBots() {
  const [bots, setBots] = useState<any[]>([])
  const [instanceDestino, setInstanceDestino] = useState('')
  const [intencion, setIntencion] = useState('')
  const [limiteTurnos, setLimiteTurnos] = useState(10)
  const [corriendo, setCorriendo] = useState(false)
  const [log, setLog] = useState<{rol:string,mensaje:string}[]>([])
  const [resultado, setResultado] = useState<{ventaCerrada:boolean,turnos:number}|null>(null)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then(d => {
      const activos = (Array.isArray(d) ? d : []).filter((b:any) => b.activo && b.instance !== 'TuAgentX_Demo')
      setBots(activos)
      if (activos.length > 0) setInstanceDestino(activos[0].instance)
    }).catch(() => {})
  }, [])

  async function lanzar() {
    if (!instanceDestino || !intencion.trim()) return
    setCorriendo(true)
    setLog([])
    setResultado(null)
    try {
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceDestino, intencion, limiteTurnos })
      })
      const data = await res.json()
      if (!data.simId) throw new Error('Sin simId')
      const simId = data.simId
      let desde = 0
      let intentosSinNovedad = 0
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`/api/simulador/${simId}?desde=${desde}`)
          const d = await r.json()
          if (d.mensajes && d.mensajes.length > 0) {
            intentosSinNovedad = 0
            for (const m of d.mensajes) {
              setLog(prev => [...prev, { rol: m.rol, mensaje: m.mensaje }])
              await new Promise(r => setTimeout(r, 300))
            }
            desde = d.total
          } else {
            intentosSinNovedad++
          }
          if (d.status?.done) {
            clearInterval(poll)
            setResultado({ ventaCerrada: d.status.ventaCerrada, turnos: d.status.turnos })
            setCorriendo(false)
          } else if (intentosSinNovedad > 40) {
            clearInterval(poll)
            setCorriendo(false)
          }
        } catch(e) { clearInterval(poll); setCorriendo(false) }
      }, 2000)
    } catch(e) {
      setLog([{ rol: 'sistema', mensaje: 'Error al lanzar simulacion' }])
      setCorriendo(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold">🤖 Simulador de Venta</h2>
        <p className="text-zinc-500 text-xs">El agente Demo actua como cliente y conversa con el bot seleccionado hasta cerrar una venta.</p>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Bot destino</label>
          <select value={instanceDestino} onChange={e => setInstanceDestino(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
            {bots.length === 0 && <option value="">Sin bots activos</option>}
            {bots.map(b => <option key={b.id} value={b.instance}>{b.name} ({b.instance})</option>)}
          </select>
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Intencion del cliente</label>
          <input value={intencion} onChange={e => setIntencion(e.target.value)}
            placeholder="Ej: quiero comprar una crema hidratante"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Limite de turnos (3-20)</label>
          <input type="number" min={3} max={20} value={limiteTurnos} onChange={e => setLimiteTurnos(parseInt(e.target.value) || 10)}
            className="w-40 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <button onClick={lanzar} disabled={corriendo || !instanceDestino || !intencion.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors">
          {corriendo ? '⏳ Simulando...' : '▶ Lanzar simulacion'}
        </button>
      </div>

      {(log.length > 0 || corriendo) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <h3 className="text-white font-semibold text-sm">Log de conversacion</h3>
            {resultado && (
              <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (resultado.ventaCerrada ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                {resultado.ventaCerrada ? "✅ Venta cerrada" : `⏹ ${resultado.turnos} turnos`}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {corriendo && log.length === 0 && (
              <p className="text-zinc-500 text-xs animate-pulse">Iniciando simulacion...</p>
            )}
            {log.map((l, i) => (
              <div key={i} className={"flex gap-2 " + (l.rol === 'cliente' ? 'justify-end' : 'justify-start')}>
                {l.rol === 'sistema' ? (
                  <div className="w-full text-center text-zinc-500 text-xs italic py-1">{l.mensaje}</div>
                ) : (
                  <div className={"max-w-xs px-3 py-2 rounded-xl text-sm " + (l.rol === 'cliente' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-200')}>
                    <div className="text-xs opacity-60 mb-0.5">{l.rol === 'cliente' ? '👤 Cliente' : '🤖 Bot'}</div>
                    {l.mensaje}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
// ─── Página principal ─────────────────────────────────────────────────────────
export default function DemoAdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [tab, setTab] = useState<'demo'|'comportamientos'|'estados'|'bots'>('demo')

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
  }, [user])

  const TABS = [
    { id: 'demo',            label: '🤖 Demo' },
    { id: 'comportamientos', label: '⚡ Comportamientos' },
    { id: 'estados',         label: '🗂 Estados' },
    { id: 'bots',            label: '🤖 Bots' },
  ] as const

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Motor de Agente TuAgentX</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Demo pública, comportamientos inteligentes y conversaciones con estados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
              tab === t.id ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'demo'            && <TabDemo />}
      {tab === 'comportamientos' && <TabComportamientos />}
      {tab === 'estados'         && <TabEstados />}
      {tab === 'bots'            && <TabBots />}
    </div>
  )
}

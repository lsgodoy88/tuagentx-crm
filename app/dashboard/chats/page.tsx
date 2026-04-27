'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Conversacion = {
  id: string; numero: string; instancia: string; estado: string
  intencion?: string; score: number; createdAt: string; updatedAt: string
  mensajes: { contenido: string; rol: string; createdAt: string }[]
  _count: { mensajes: number }
}
type Mensaje = { id: string; rol: string; contenido: string; intencion?: string; createdAt: string }

const ESTADOS = ['NUEVO','INTERESADO','DEMO','CLIENTE','MOLESTO','SOPORTE','FRIO']

const ESTADO_BADGE: Record<string, { emoji: string; label: string; color: string }> = {
  NUEVO:      { emoji: '🆕', label: 'Nuevo',      color: 'bg-zinc-700 text-zinc-200' },
  INTERESADO: { emoji: '👀', label: 'Interesado', color: 'bg-blue-500/20 text-blue-300' },
  DEMO:       { emoji: '🎯', label: 'Demo',        color: 'bg-violet-500/20 text-violet-300' },
  CLIENTE:    { emoji: '✅', label: 'Cliente',     color: 'bg-emerald-500/20 text-emerald-300' },
  MOLESTO:    { emoji: '😤', label: 'Molesto',     color: 'bg-red-500/20 text-red-300' },
  SOPORTE:    { emoji: '🛠️', label: 'Soporte',    color: 'bg-amber-500/20 text-amber-300' },
  FRIO:       { emoji: '❄️', label: 'Frío',        color: 'bg-slate-500/20 text-slate-300' },
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `hace ${h}h`
  if (h < 48)   return 'ayer'
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-zinc-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-zinc-400 text-xs">{Math.round(score)}</span>
    </div>
  )
}

// ─── Contenido del chat (reutilizado en accordion y panel lateral) ─────────────
function ChatContent({
  conv, historial, loadingChat, cambiandoEstado, onCambiarEstado, chatEndRef,
}: {
  conv: Conversacion
  historial: Mensaje[]
  loadingChat: boolean
  cambiandoEstado: boolean
  onCambiarEstado: (estado: string) => void
  chatEndRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      {/* Mini-header con estado */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-zinc-700 flex-wrap">
        <div>
          <span className="text-emerald-400 font-mono text-sm">+{conv.numero}</span>
          {conv.intencion && <span className="text-zinc-500 text-xs ml-2">{conv.intencion}</span>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ScoreBar score={Math.round(conv.score)} />
          <select
            value={conv.estado}
            disabled={cambiandoEstado}
            onChange={e => onCambiarEstado(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50">
            {ESTADOS.map(e => (
              <option key={e} value={e}>{ESTADO_BADGE[e]?.emoji} {e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensajes */}
      <div className="overflow-y-auto p-3 space-y-3 max-h-80 md:max-h-none md:flex-1">
        {loadingChat ? (
          <div className="text-zinc-500 text-sm text-center py-6">Cargando historial...</div>
        ) : historial.length === 0 ? (
          <div className="text-zinc-600 text-sm text-center py-6">Sin mensajes registrados</div>
        ) : historial.map((m, i) => (
          <div key={m.id || i} className={`flex ${m.rol === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
              m.rol === 'user'
                ? 'bg-zinc-700 text-zinc-200 rounded-tl-sm'
                : 'bg-emerald-500/20 text-emerald-100 rounded-tr-sm'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.contenido}</div>
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="text-xs opacity-40">
                  {new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {m.intencion && (
                  <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full opacity-70">{m.intencion}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ChatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [lista, setLista] = useState<Conversacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'calientes'|'activos'|'atencion'|'frios'>('calientes')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [historial, setHistorial] = useState<Mensaje[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard')
  }, [user])

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial])

  async function cargar() {
    setLoading(true)
    try {
      const d = await fetch('/api/bot-conversaciones').then(r => r.json())
      setLista(Array.isArray(d) ? d : [])
    } catch(e) { console.log(e) }
    setLoading(false)
  }

  async function verChat(id: string) {
    setSeleccionada(id)
    setLoadingChat(true)
    try {
      const d = await fetch(`/api/bot-conversaciones/${id}`).then(r => r.json())
      setHistorial(d.mensajes || [])
    } catch(e) { console.log(e) }
    setLoadingChat(false)
  }

  function handleCardClick(c: Conversacion) {
    if (seleccionada === c.id) {
      setSeleccionada(null)
    } else {
      verChat(c.id)
    }
  }

  async function cambiarEstado(id: string, estado: string) {
    setCambiandoEstado(true)
    await fetch(`/api/bot-conversaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    setLista(prev => prev.map(c => c.id === id ? { ...c, estado } : c))
    setCambiandoEstado(false)
  }

  const now = Date.now()

  function contsTab(convs: Conversacion[], t: string): Conversacion[] {
    switch (t) {
      case 'calientes': return convs.filter(c => c.score >= 70)
      case 'activos':   return convs.filter(c => c.score < 70 && (now - new Date(c.updatedAt).getTime()) < 86400000)
      case 'atencion':  return convs.filter(c => c.estado === 'MOLESTO' || c.estado === 'SOPORTE')
      case 'frios':     return convs.filter(c => c.estado === 'FRIO' || (now - new Date(c.updatedAt).getTime()) >= 172800000)
      default: return convs
    }
  }

  const busqFiltrada = busqueda.trim()
    ? lista.filter(c => c.numero.includes(busqueda.replace(/\D/g, '')))
    : lista

  const filtrados = contsTab(busqFiltrada, tab)
  const convSelec = lista.find(c => c.id === seleccionada)

  const TABS = [
    { id: 'calientes', label: '🔥 Calientes', count: contsTab(lista, 'calientes').length },
    { id: 'activos',   label: '👀 Activos',   count: contsTab(lista, 'activos').length },
    { id: 'atencion',  label: '😤 Atención',  count: contsTab(lista, 'atencion').length },
    { id: 'frios',     label: '❄️ Fríos',     count: contsTab(lista, 'frios').length },
  ] as const

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 7rem)' }}>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">💬 Chats</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Conversaciones de TuAgentX</p>
        </div>
        <button onClick={cargar} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">↻ Actualizar</button>
      </div>

      {/* Tabs + Busqueda */}
      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSeleccionada(null) }}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                tab === t.id ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-zinc-600 text-zinc-200' : 'bg-zinc-800 text-zinc-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por número..."
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 w-48"
        />
      </div>

      {/* Main layout: mobile=columna, desktop=fila */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 overflow-hidden">

        {/* Cards list */}
        <div className="md:w-80 md:flex-shrink-0 overflow-y-auto flex flex-col gap-2 md:pr-1">
          {filtrados.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
              No hay conversaciones aquí
            </div>
          ) : filtrados.map(c => {
            const badge = ESTADO_BADGE[c.estado] || { emoji: '❓', label: c.estado, color: 'bg-zinc-700 text-zinc-300' }
            const isCaliente = c.score >= 70
            const lastMsg = c.mensajes[0]
            const isOpen = seleccionada === c.id

            return (
              <div key={c.id} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
                isOpen ? 'border-emerald-500/50' : 'border-zinc-800'
              }`}>
                {/* Card header — clickable */}
                <button
                  onClick={() => handleCardClick(c)}
                  className={`w-full text-left p-4 hover:bg-zinc-800/50 transition-colors ${isOpen ? 'bg-zinc-800/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-emerald-400 text-sm font-mono">+{c.numero}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${isCaliente ? 'bg-orange-500/20 text-orange-300' : badge.color}`}>
                        {isCaliente ? '🔥 Quiere comprar' : `${badge.emoji} ${badge.label}`}
                      </span>
                      {/* Chevron solo en mobile */}
                      <span className={`md:hidden text-zinc-500 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <ScoreBar score={Math.round(c.score)} />
                  {lastMsg && (
                    <div className="text-zinc-500 text-xs mt-2 line-clamp-1">{lastMsg.contenido}</div>
                  )}
                  <div className="text-zinc-600 text-xs mt-1">{tiempoRelativo(c.updatedAt)}</div>
                </button>

                {/* Acordeón — solo en mobile, cuando está abierto */}
                {isOpen && (
                  <div className="md:hidden border-t border-zinc-700 bg-zinc-950 flex flex-col">
                    <ChatContent
                      conv={convSelec!}
                      historial={historial}
                      loadingChat={loadingChat}
                      cambiandoEstado={cambiandoEstado}
                      onCambiarEstado={estado => cambiarEstado(c.id, estado)}
                      chatEndRef={chatEndRef}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Panel lateral — solo en desktop */}
        <div className="hidden md:flex flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex-col overflow-hidden min-w-0">
          {!seleccionada || !convSelec ? (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              Selecciona una conversación para ver el historial
            </div>
          ) : (
            <ChatContent
              conv={convSelec}
              historial={historial}
              loadingChat={loadingChat}
              cambiandoEstado={cambiandoEstado}
              onCambiarEstado={estado => cambiarEstado(seleccionada!, estado)}
              chatEndRef={chatEndRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}

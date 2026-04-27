'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Tab Demo ────────────────────────────────────────────────────────────────
const WIZARD_PASOS = ['Perfil', 'Conectar', 'Identidad', 'Conocimiento', 'Negocio', 'Escalado & FAQ']
const CARACTERISTICAS_GRUPOS = [
  { grupo: 'Logistica', items: ['A domicilio', 'Envio gratis', 'En tienda', 'Express'] },
  { grupo: 'Pagos',     items: ['Contraentrega', 'Transferencia', 'Tarjeta', 'Cuotas'] },
  { grupo: 'Atencion',  items: ['Solo WhatsApp', 'Presencial', 'Telefono', 'Chat web'] },
  { grupo: 'Diferenciadores', items: ['Garantia', 'Soporte tecnico', 'Exclusivo', 'Mejor precio'] },
]

function getCaracteristicasFiltradas(tipo: string) {
  if (tipo === 'cartera') {
    return [
      { grupo: 'Pagos', items: ['Cuotas', 'Transferencia', 'Contraentrega'] },
      { grupo: 'Atencion', items: ['Solo WhatsApp', 'Presencial'] },
    ]
  }
  if (tipo === 'citas') {
    return [
      { grupo: 'Atencion', items: ['Solo WhatsApp', 'Presencial', 'Telefono'] },
      { grupo: 'Diferenciadores', items: ['Garantia', 'Soporte tecnico'] },
    ]
  }
  return CARACTERISTICAS_GRUPOS
}

function buildPromptDemo(tipo: string, empresa: string, agente: string): string {
  const e = empresa || 'la empresa'
  const a = agente || 'el agente'
  const prompts = {
    ventas:   `Eres ${a}, el agente de ventas de ${e}. Tu objetivo principal es vender, asesorar y cerrar clientes 24/7.`,
    soporte:  `Eres ${a}, el agente de soporte de ${e}. Tu mision es resolver dudas tecnicas.`,
    atencion: `Eres ${a}, agente de atencion al cliente de ${e}. Te especializas en posventa y fidelizacion.`,
    manual:   `Eres ${a}, asesor tecnico de ${e}. Respondes con base en documentacion proporcionada.`,
  }
  return (prompts as Record<string, string>)[tipo] || ''
}

function TabDemo() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qr, setQr] = useState<string|null>(null)
  const [botConectado, setBotConectado] = useState(false)
  const [botNumero, setBotNumero] = useState<string|null>(null)
  const [botActivo, setBotActivo] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [botError, setBotError] = useState<string|null>(null)
  const [wizardPaso, setWizardPaso] = useState(1)
  const [tipoAgente, setTipoAgente] = useState<'ventas'|'cartera'|'citas'|''>('')
  const [tipoNegocio, setTipoNegocio] = useState<'productos'|'servicios'|null>(null)
  const [configDemoAbierto, setConfigDemoAbierto] = useState(false)
  const [personalidadTipo, setPersonalidadTipo] = useState('')
  const [caracteristicas, setCaracteristicas] = useState<string[]>([])
  const [conocimientoBase, setConocimientoBase] = useState('')
  const [kbNombre, setKbNombre] = useState('')
  const [subiendoKB, setSubiendoKB] = useState(false)
  const [generandoKB, setGenerandoKB] = useState(false)
  const kbRef = useRef<HTMLInputElement>(null)
  const stepperRef = useRef<HTMLDivElement>(null)
  const stepBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [faq, setFaq] = useState<any[]>([])
  const [config, setConfig] = useState({
    promptVendedor: '', mensajeDespedida: '', tiempoSesion: 120,
    nombreAgente: '', fotoAgente: '', nombreEmpresa: '',
    personalidad: '', numeroEscalado: '', idioma: 'espanol',
  })
  useEffect(() => { fetchLeads(); fetchBot() }, [])
  useEffect(() => {
    const btn = stepBtnRefs.current[wizardPaso - 1]
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [wizardPaso])
  async function fetchLeads() {
    setLoading(true)
    try { const d = await fetch('/api/demo').then(r => r.json()); setLeads(Array.isArray(d) ? d : []) }
    catch(e) { console.log(e) }
    setLoading(false)
  }
  async function fetchBot() {
    setActualizando(true); setBotError(null)
    try {
      const d = await fetch('/api/demo/bot').then(r => r.json())
      if (d.error) { setBotError(d.error); return }
      setBotConectado(d.conectado || false); setBotNumero(d.numero || null); setQr(d.base64 || null)
      if (d.activo !== undefined) setBotActivo(d.activo)
      setConfig({
        promptVendedor: d.promptVendedor || '', mensajeDespedida: d.mensajeDespedida || '',
        tiempoSesion: d.tiempoSesion || 120, nombreAgente: d.nombreAgente || '',
        fotoAgente: d.fotoAgente || '', nombreEmpresa: d.nombreEmpresa || '',
        personalidad: d.personalidad || '', numeroEscalado: d.numeroEscalado || '',
        idioma: d.idioma || 'espanol',
      })
      if (d.conocimientoBase) setConocimientoBase(d.conocimientoBase)
      if (d.caracteristicas) { try { setCaracteristicas(JSON.parse(d.caracteristicas)) } catch {} }
      if (d.tipoAgente) setTipoAgente(d.tipoAgente)
      if (d.tipoNegocio) setTipoNegocio(d.tipoNegocio)
    } catch(e) { setBotError('Error al consultar el estado del bot') }
    finally { setActualizando(false) }
  }
  async function cambiarNumero() {
    setCambiando(true); setBotError(null); setQr(null); setBotConectado(false); setBotNumero(null)
    try {
      const d = await fetch('/api/demo/bot', { method: 'POST' }).then(r => r.json())
      if (!d.ok) { setBotError(d.error || 'Error al generar QR'); return }
      setQr(d.base64 || null)
    } catch(e) { setBotError('Error de conexion') }
    finally { setCambiando(false) }
  }
  async function toggleActivo() {
    const n = !botActivo; setBotActivo(n)
    await fetch('/api/demo/bot', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ activo: n }) })
  }
  async function handleSubirKB(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoKB(true)
    const formData = new FormData()
    formData.append('archivo', file)
    const res = await fetch('/api/extraer-texto', { method: 'POST', body: formData })
    const data = await res.json()
    setSubiendoKB(false)
    if (!data.texto) { alert(data.error || 'Error extrayendo texto'); return }
    setGenerandoKB(true)
    const res2 = await fetch('/api/agentes/analizar-documento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textoDocumento: data.texto, nombreAgente: config.nombreAgente, nombreEmpresa: config.nombreEmpresa }),
    })
    const data2 = await res2.json()
    if (data2.texto) setConocimientoBase(data2.texto)
    else setConocimientoBase(data.texto)
    setKbNombre(file.name)
    setGenerandoKB(false)
  }

  async function handleGenerarKB() {
    setGenerandoKB(true)
    const res = await fetch('/api/agentes/analizar-documento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textoDocumento: conocimientoBase, nombreAgente: config.nombreAgente, nombreEmpresa: config.nombreEmpresa }),
    })
    const data = await res.json()
    if (data.texto) setConocimientoBase(data.texto)
    else alert(data.error || 'Error analizando documento')
    setGenerandoKB(false)
  }

  async function guardarConfig() {
    setGuardando(true)
    await fetch('/api/demo/bot', {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...config, conocimientoBase, caracteristicas: JSON.stringify(caracteristicas), tipoAgente, tipoNegocio })
    })
    await fetch('/api/auth/session', { method: 'GET' })
    setGuardando(false)
  }
  function handlePersonalidadTipo(tipo: string) {
    setPersonalidadTipo(tipo)
    if (tipo) setConfig(prev => ({ ...prev, personalidad: buildPromptDemo(tipo, prev.nombreEmpresa, prev.nombreAgente) }))
  }
  function toggleCaracteristica(item: string) {
    setCaracteristicas(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item])
  }
  const hoy = leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length
  const semana = leads.filter(l => (Date.now() - new Date(l.createdAt).getTime()) < 7*86400000).length
  const unicos = new Set(leads.map(l => l.numero).filter(Boolean)).size
  const stats = [
    { label: 'Total leads', value: leads.length, icon: 'x' },
    { label: 'Hoy', value: hoy, icon: 'x' },
    { label: 'Semana', value: semana, icon: 'x' },
    { label: 'Unicos', value: unicos, icon: 'x' },
  ]
  const caracteristicasGrupos = getCaracteristicasFiltradas(tipoAgente)
  const nextDisabled =
    (wizardPaso === 1 && (!tipoAgente || (tipoAgente === 'ventas' && !tipoNegocio))) ||
    (wizardPaso === 2 && !botConectado)

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Agente Demo</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfigDemoAbierto(v => !v)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
              ⚙️ Config Demo {configDemoAbierto ? '▲' : '▼'}
            </button>
            <button onClick={guardarConfig} disabled={guardando}
              className={"px-5 py-2 rounded-xl font-semibold text-sm " + (guardando ? "bg-emerald-500 text-white opacity-70" : "bg-emerald-500 hover:bg-emerald-400 text-white")}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Panel colapsable Config Demo */}
        {configDemoAbierto && (
          <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <p className="text-white font-semibold text-sm">Configuración del demo</p>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Tiempo de sesion (segundos)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={30} max={300} step={30} value={config.tiempoSesion}
                  onChange={e => setConfig({...config, tiempoSesion: parseInt(e.target.value)})}
                  className="flex-1 accent-emerald-500" />
                <span className="text-white text-sm font-mono w-16 text-right">{config.tiempoSesion}s</span>
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Instrucciones del vendedor (post-demo)</label>
              <textarea value={config.promptVendedor} onChange={e => setConfig({...config, promptVendedor: e.target.value})}
                rows={4} placeholder="Eres un asesor de ventas..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Mensaje de despedida</label>
              <textarea value={config.mensajeDespedida} onChange={e => setConfig({...config, mensajeDespedida: e.target.value})}
                rows={3} placeholder="Tu prueba ha terminado..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <button onClick={guardarConfig} disabled={guardando}
              className="px-5 py-2 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors">
              {guardando ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        )}

        <div ref={stepperRef} className="flex mb-2 overflow-x-auto scrollbar-none">
          {WIZARD_PASOS.map((p, i) => (
            <button key={i} ref={el => { stepBtnRefs.current[i] = el }} onClick={() => setWizardPaso(i + 1)}
              className={"flex-none text-center text-xs px-3 py-1.5 font-medium transition-colors " +
                (wizardPaso === i + 1 ? "text-emerald-400" : wizardPaso > i + 1 ? "text-zinc-300" : "text-zinc-600")}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {WIZARD_PASOS.map((_, i) => (
            <div key={i} className={"h-1 flex-1 rounded-full " +
              (wizardPaso > i + 1 ? "bg-emerald-500" : wizardPaso === i + 1 ? "bg-emerald-400" : "bg-zinc-800")} />
          ))}
        </div>
      </div>

      {/* Paso 1 — Perfil */}
      {wizardPaso === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">¿Para qué usarás el agente?</p>
            <p className="text-zinc-500 text-sm mt-0.5">Elige el perfil que mejor describe tu caso de uso</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { key: 'ventas',  icon: '🛍️', titulo: 'Ventas',   desc: 'Vende tus productos o servicios 24/7 con IA',                         casos: 'Tiendas, restaurantes, distribuidoras' },
              { key: 'cartera', icon: '💰', titulo: 'Cartera',  desc: 'Cobra deudas y recordatorios automáticos por WhatsApp',               casos: 'Distribuidoras, créditos, carteras' },
              { key: 'citas',   icon: '📅', titulo: 'Citas',    desc: 'Agenda citas con recordatorios y cancelaciones automáticas',           casos: 'Médicos, abogados, consultores, spas' },
            ].map(({ key, icon, titulo, desc, casos }) => (
              <button key={key} onClick={() => { setTipoAgente(key as any); if (key !== 'ventas') setTipoNegocio(null) }}
                className={"text-left p-4 rounded-2xl border transition-all " +
                  (tipoAgente === key
                    ? "bg-emerald-500/10 border-emerald-500"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-600")}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{icon}</span>
                  <span className={"font-semibold text-base " + (tipoAgente === key ? "text-white" : "text-zinc-200")}>{titulo}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-1 ml-10">{desc}</p>
                <p className="text-xs text-zinc-600 ml-10">{casos}</p>
              </button>
            ))}
          </div>
          {tipoAgente === 'ventas' && (
            <div className="space-y-2 pt-1">
              <p className="text-zinc-300 text-sm font-medium">¿Qué tipo de negocio tienes?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'productos', icon: '📦', label: 'Productos' },
                  { key: 'servicios', icon: '🛠️', label: 'Servicios' },
                ].map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setTipoNegocio(key as any)}
                    className={"p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all " +
                      (tipoNegocio === key
                        ? "bg-emerald-500/10 border-emerald-500 text-white"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-400")}>
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paso 2 — Conectar */}
      {wizardPaso === 2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-white font-semibold mb-1">Numero demo</div>
              <div className="flex items-center gap-3">
                <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (botConectado ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>
                  {botConectado ? "Conectado" : "Desconectado"}
                </span>
                {botNumero && <span className="text-emerald-400 text-sm font-mono">+{botNumero}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={fetchBot} disabled={actualizando || cambiando}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg">
                {actualizando ? "Actualizando..." : "Actualizar"}
              </button>
              <button onClick={toggleActivo} disabled={actualizando || cambiando}
                className={"font-semibold text-xs px-3 py-1.5 rounded-lg " + (botActivo ? "bg-red-500 text-white" : "bg-emerald-500 text-black")}>
                {botActivo ? "Pausar" : "Activar"}
              </button>
              <button onClick={cambiarNumero} disabled={actualizando || cambiando}
                className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg">
                {cambiando ? "Generando QR..." : (botConectado ? "Cambiar numero" : "Conectar")}
              </button>
            </div>
          </div>
          {botError && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{botError}</div>}
          {qr && <div className="flex justify-center"><img src={qr} alt="QR" className="w-48 h-48 rounded-xl border border-zinc-700" /></div>}
        </div>
      )}

      {/* Paso 3 — Identidad */}
      {wizardPaso === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Identidad del agente</p>
            <p className="text-zinc-500 text-sm mt-0.5">Define quién es tu agente y cómo se comportará</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Nombre de la empresa</label>
              <input value={config.nombreEmpresa} onChange={e => setConfig({...config, nombreEmpresa: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Ej: Mi Empresa" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Nombre del agente</label>
              <input value={config.nombreAgente} onChange={e => setConfig({...config, nombreAgente: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Ej: Sofia" />
            </div>
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1.5 block">Tipo de agente</label>
            <select value={personalidadTipo} onChange={e => handlePersonalidadTipo(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
              <option value="">— Selecciona un tipo —</option>
              <option value="ventas">💰 Agente de ventas — Vende, asesora y cierra clientes 24/7</option>
              <option value="soporte">🔧 Soporte y calidad — Resuelve dudas técnicas del producto</option>
              <option value="atencion">🤝 Atención al cliente — Posventa, quejas y fidelización</option>
              <option value="manual">📖 Asesor técnico — Responde con base en documentos</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 text-xs">Instrucciones del agente</label>
              {personalidadTipo && (
                <button onClick={() => setConfig(prev => ({ ...prev, personalidad: buildPromptDemo(personalidadTipo, prev.nombreEmpresa, prev.nombreAgente) }))}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  ↺ Regenerar prompt
                </button>
              )}
            </div>
            <textarea value={config.personalidad} onChange={e => setConfig({...config, personalidad: e.target.value})}
              rows={7} placeholder="Selecciona un tipo arriba para generar un prompt, o escribe las instrucciones manualmente..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
        </div>
      )}

      {/* Paso 4 — Conocimiento */}
      {wizardPaso === 4 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Conocimiento base</p>
            <p className="text-zinc-500 text-sm mt-0.5">Información que el agente usará para responder con precisión</p>
          </div>
          <div className="flex gap-3">
            <div className={kbNombre ? 'w-full' : 'flex-1'}>
              <input ref={kbRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleSubirKB} />
              <button onClick={() => kbRef.current?.click()} disabled={subiendoKB || generandoKB}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-zinc-700">
                {subiendoKB ? <><span className="animate-spin inline-block">↻</span> Extrayendo...</>
                  : generandoKB ? <><span className="animate-spin inline-block">↻</span> Analizando...</>
                  : '📎 Subir PDF / DOCX / TXT'}
              </button>
            </div>
            {!kbNombre && (
              <button onClick={handleGenerarKB} disabled={generandoKB || subiendoKB}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                {generandoKB ? <><span className="animate-spin inline-block">↻</span> Analizando...</> : '🤖 Generar con IA'}
              </button>
            )}
          </div>
          {kbNombre && <p className="text-emerald-400 text-xs">✅ {kbNombre}</p>}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 text-xs">Contenido del conocimiento base</label>
              {conocimientoBase && <span className="text-zinc-600 text-xs">{conocimientoBase.length} caracteres</span>}
            </div>
            <textarea value={conocimientoBase} onChange={e => setConocimientoBase(e.target.value)}
              rows={12} placeholder="Usa los botones de arriba para generar o cargar el conocimiento base, o escríbelo manualmente..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
        </div>
      )}

      {/* Paso 5 — Negocio (dinámico según tipoAgente) */}
      {wizardPaso === 5 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Características del negocio</p>
            <p className="text-zinc-500 text-sm mt-0.5">Selecciona las que aplican — se añadirán al prompt del agente automáticamente</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {caracteristicasGrupos.map(({ grupo, items }) => (
              <div key={grupo} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-300 text-xs font-semibold mb-3">{grupo}</p>
                <div className="space-y-2.5">
                  {items.map(item => (
                    <label key={item} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleCaracteristica(item)}>
                      <div className={"w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 " +
                        (caracteristicas.includes(item) ? "bg-emerald-500 border-emerald-500" : "border-zinc-600 group-hover:border-zinc-400")}>
                        {caracteristicas.includes(item) && <span className="text-white text-xs leading-none">✓</span>}
                      </div>
                      <span className={"text-sm select-none transition-colors " +
                        (caracteristicas.includes(item) ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {caracteristicas.length > 0 && (
            <p className="text-zinc-500 text-xs">{caracteristicas.length} característica{caracteristicas.length !== 1 ? 's' : ''} seleccionada{caracteristicas.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Paso 6 — Escalado & FAQ */}
      {wizardPaso === 6 && (
        <div className="space-y-6">
          <div>
            <p className="text-white font-semibold">Escalado y preguntas frecuentes</p>
            <p className="text-zinc-500 text-sm mt-0.5">Configura a dónde escalar conversaciones y las respuestas automáticas</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-zinc-300 text-sm font-semibold">📞 Número de escalado</p>
            <p className="text-zinc-500 text-xs">Cuando el agente no pueda resolver algo, enviará la conversación a este número</p>
            <input value={config.numeroEscalado} onChange={e => setConfig({...config, numeroEscalado: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              placeholder="573001234567" />
          </div>
          <div className="space-y-3">
            <p className="text-zinc-300 text-sm font-semibold">💬 Preguntas frecuentes</p>
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input value={item.pregunta} onChange={e => setFaq(prev => prev.map((p, j) => j === i ? { ...p, pregunta: e.target.value } : p))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="¿Pregunta frecuente?" />
                  <button onClick={() => setFaq(prev => prev.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 text-sm transition-colors pt-2">✕</button>
                </div>
                <textarea value={item.respuesta} onChange={e => setFaq(prev => prev.map((p, j) => j === i ? { ...p, respuesta: e.target.value } : p))}
                  rows={2} placeholder="Respuesta..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
            ))}
            <button onClick={() => setFaq(prev => [...prev, { pregunta: '', respuesta: '' }])}
              className="w-full py-3 border border-dashed border-zinc-700 hover:border-emerald-500 text-zinc-500 hover:text-emerald-400 rounded-xl text-sm transition-colors">
              + Agregar pregunta frecuente
            </button>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
        {wizardPaso > 1 && (
          <button onClick={() => setWizardPaso(p => p - 1)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            ← Atrás
          </button>
        )}
        {wizardPaso < 6 ? (
          <button onClick={() => setWizardPaso(p => p + 1)}
            disabled={nextDisabled}
            className={"flex-1 text-sm font-semibold py-3 rounded-xl transition-colors text-white " +
              (nextDisabled ? "bg-zinc-700 opacity-50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500")}>
            Siguiente →
          </button>
        ) : (
          <button onClick={guardarConfig} disabled={guardando}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            {guardando ? 'Guardando...' : '✅ Guardar y activar'}
          </button>
        )}
      </div>
    </div>
  )
}


export default function DemoConfigurarPage() {
  const router = useRouter()
  return (
    <div className="max-w-3xl">
      <button onClick={() => router.push('/dashboard/demo')}
        className="text-zinc-500 hover:text-white text-sm mb-6 transition-colors">
        ← Motor de Agente
      </button>
      <TabDemo />
    </div>
  )
}

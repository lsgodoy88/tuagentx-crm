'use client'
import { fetchApi } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PhoneInput from '@/components/PhoneInput'

const WIZARD_PASOS = [
  'Perfil',
  'Identidad y personalidad',
  'Características del negocio',
  'Conocimiento base',
  'FAQ & Escalado',
  'Posventa',
  'Conectar QR',
]

const CARACTERISTICAS_GRUPOS_BASE = [
  { grupo: '🚚 Logística',        items: ['A domicilio', 'Envío gratis', 'En tienda', 'Express'] },
  { grupo: '💳 Pagos',            items: ['Contraentrega', 'Transferencia', 'Tarjeta', 'Cuotas'] },
  { grupo: '🤝 Atención',         items: ['Solo WhatsApp', 'Presencial', 'Teléfono', 'Chat web'] },
  { grupo: '⚡ Diferenciadores',  items: ['Garantía', 'Soporte técnico', 'Exclusivo', 'Mejor precio'] },
]
const CARACTERISTICAS_GRUPOS_CARTERA = [
  { grupo: '💳 Pagos',    items: ['Contraentrega', 'Transferencia', 'Tarjeta', 'Cuotas'] },
  { grupo: '📋 Gestión',  items: ['Acuerdo de pago', 'Refinanciación', 'Descuento por pronto pago', 'Embargo'] },
]
const CARACTERISTICAS_GRUPOS_CITAS = [
  { grupo: '🤝 Atención',    items: ['Solo WhatsApp', 'Presencial', 'Teléfono', 'Chat web'] },
  { grupo: '📍 Modalidad',   items: ['Virtual', 'A domicilio', 'En consultorio', 'Urgencias'] },
]

function getCaracteristicasGrupos(tipoAgente: string, tipoNegocio: string | null) {
  if (tipoAgente === 'cartera') return CARACTERISTICAS_GRUPOS_CARTERA
  if (tipoAgente === 'citas')   return CARACTERISTICAS_GRUPOS_CITAS
  if (tipoAgente === 'ventas' && tipoNegocio === 'servicios')
    return CARACTERISTICAS_GRUPOS_BASE.filter(g => !g.grupo.includes('Logística'))
  return CARACTERISTICAS_GRUPOS_BASE
}

function buildPrompt(tipo: string, empresa: string, agente: string) {
  const e = empresa || 'la empresa'
  const a = agente  || 'el agente'
  const prompts: Record<string, string> = {
    ventas:   `Eres ${a}, el agente de ventas de ${e}. Tu objetivo principal es vender, asesorar y cerrar clientes 24/7. Eres proactivo, conoces todos los productos y servicios a fondo, manejas objeciones con confianza y siempre buscas el cierre. Hablas con energía y convicción. Cuando un cliente muestra interés, guías la conversación hacia la decisión de compra. Ofreces alternativas si el producto inicial no convence. Siempre terminas con una llamada a la acción clara y directa.`,
    soporte:  `Eres ${a}, el agente de soporte técnico de ${e}. Tu misión es resolver dudas técnicas del producto de forma clara y eficiente. Eres paciente, metódico y muy preciso en tus explicaciones. Guías al cliente paso a paso para solucionar sus problemas. Cuando enfrentas un caso complejo, escalas al equipo técnico apropiado. Siempre confirmas que el cliente quedó satisfecho antes de cerrar la conversación.`,
    atencion: `Eres ${a}, el agente de atención al cliente de ${e}. Te especializas en posventa, manejo de quejas y fidelización. Eres empático, profesional y orientado a la solución. Cuando recibes una queja, primero validas los sentimientos del cliente y te disculpas, luego buscas la solución más satisfactoria dentro de las políticas de la empresa. Tu objetivo es que cada cliente termine sintiéndose escuchado, valorado y leal a la marca.`,
    manual:   `Eres ${a}, el asesor técnico de ${e}. Respondes basándote estrictamente en la documentación y manuales proporcionados. Solo proporcionas información respaldada por los documentos de conocimiento base. Si una pregunta no está cubierta en tu base de conocimiento, lo indicas claramente y ofreces escalar con un especialista humano. Eres preciso, confiable y transparente sobre los límites de tu conocimiento.`,
    cartera:  `Eres ${a}, el agente de cobro de ${e}. Tu misión es gestionar de manera empática y profesional el cobro de cartera vencida. Eres amable pero firme. Cuando contactas a un cliente, te identificas claramente, mencionas el saldo pendiente y la fecha de vencimiento, y buscas llegar a un acuerdo de pago. Ofreces opciones de pago cuando es posible. Registras compromisos de pago y haces seguimiento. Nunca eres agresivo ni amenazante. Tu objetivo es recuperar la cartera manteniendo la relación con el cliente.`,
    citas:    `Eres ${a}, el agente de agendamiento de ${e}. Tu función es agendar, confirmar y recordar citas de manera eficiente y amigable. Cuando un cliente quiere agendar, recopilas la información necesaria: nombre, servicio requerido, fecha y hora preferida. Confirmas disponibilidad y envías recordatorios. Manejas cambios y cancelaciones con flexibilidad. Eres organizado, puntual en tus comunicaciones y siempre confirmas los detalles de cada cita.`,
  }
  return prompts[tipo] || ''
}

interface Props {
  rol: 'admin' | 'empresa'
}

export default function AgenteWizard({ rol }: Props) {
  const { update } = useSession()
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const kbRef = useRef<HTMLInputElement>(null)

  const [agente, setBot]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [wizardPaso, setWizardPaso] = useState(1)
  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(1)
  const [numeroEscaladoValido, setNumeroEscaladoValido] = useState(true)

  const [perfilGuardado, setPerfilGuardado] = useState(false)

  const [tipoAgente, setTipoAgente]   = useState('')
  const [tipoNegocio, setTipoNegocio] = useState<string | null>(null)
  const [personalidadTipo, setPersonalidadTipo] = useState('')
  const [caracteristicas, setCaracteristicas]   = useState<string[]>([])
  const [conocimientoBase, setConocimientoBase]   = useState('')
  const [kbNombre, setKbNombre]   = useState('')
  const [subiendoKB, setSubiendoKB] = useState(false)
  const [generandoKB, setGenerandoKB] = useState(false)

  const [primerProducto, setPrimerProducto] = useState({
    codigo: '', nombre: '', caracteristicas: '', cantidad: '', precio: '',
  })
  const [analizandoImg, setAnalizandoImg] = useState(false)
  const [imgMsg, setImgMsg] = useState('')
  const imgRef = useRef<HTMLInputElement>(null)

  const [botConectado, setBotConectado]     = useState(false)
  const [botNumero, setBotNumero]           = useState('')
  const [botPerfil, setBotPerfil]           = useState('')
  const [qrBase64, setQrBase64]             = useState<string | null>(null)
  const [qrCargando, setQrCargando]         = useState(false)
  const [qrRefreshKey, setQrRefreshKey]     = useState(0)
  const [cambiandoNumero, setCambiandoNumero] = useState(false)

  const [config, setConfig] = useState({
    nombre_empresa: '', nombre_agente: '', personalidad: '',
    numero_escalado: '', idioma: 'español', activo: true,
    posventa_activa: true,
    posventa_mensaje_bienvenida: '',
    posventa_intentos_cancelacion: 3,
    posventa_mensaje_seguimiento: '',
  })
  const [sugiriendo, setSugiriendo] = useState(false)
  const [faq, setFaq] = useState<any[]>([])
  const [condiciones, setCondiciones] = useState<any[]>([])

  const backHref = rol === 'admin' ? '/dashboard/bots' : '/dashboard/agentes'

  useEffect(() => {
    Promise.all([
      fetch(`/api/agentes/${id}`).then(r => r.json()),
      fetch(`/api/agentes/${id}/datos`).then(r => r.json()),
      fetch('/api/empresa-config').then(r => r.json()).catch(() => ({})),
    ]).then(([botData, datos, empresaConfig]) => {
      setBot(botData)
      if (datos.data) {
        const d = datos.data
        const telFallback = datos.data.numero_escalado || empresaConfig?.telefono || ''
        setConfig({
          nombre_empresa:  d.nombre_empresa  || '',
          nombre_agente:   d.nombre_agente   || '',
          personalidad:    d.personalidad    || '',
          idioma:          d.idioma          || 'español',
          numero_escalado: telFallback,
          activo:          true,
          posventa_activa: d.posventa_activa !== undefined
            ? (d.posventa_activa === 'si' || d.posventa_activa === true)
            : true,
          posventa_mensaje_bienvenida:   d.posventa_mensaje_bienvenida   || '',
          posventa_intentos_cancelacion: d.posventa_intentos_cancelacion ? Number(d.posventa_intentos_cancelacion) : 3,
          posventa_mensaje_seguimiento:  d.posventa_mensaje_seguimiento  || '',
        })
        if (d.conocimiento_base) setConocimientoBase(d.conocimiento_base)
        if (d.caracteristicas)   {
          try { setCaracteristicas(JSON.parse(d.caracteristicas)) } catch {}
        }
        if (d.faq?.length) setFaq(d.faq)
        if (d.condiciones) { try { setCondiciones(JSON.parse(d.condiciones)) } catch {} }
        if (d.tipo) setTipoAgente(d.tipo)
        if (d.tipo || d.configurado) setPerfilGuardado(true)
        if (d.tipo_negocio) setTipoNegocio(d.tipo_negocio)
        if (d.primerProducto) {
          try {
            const pp = typeof d.primerProducto === 'string' ? JSON.parse(d.primerProducto) : d.primerProducto
            setPrimerProducto(pp)
          } catch {}
        }
      } else if (empresaConfig?.telefono) {
        setConfig(prev => ({ ...prev, numero_escalado: empresaConfig.telefono }))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // QR — ahora está en el paso 7
  useEffect(() => {
    if (wizardPaso !== 7 || botConectado) return
    let cancelled = false
    async function cargarQR() {
      setQrCargando(true)
      try {
        const data = await fetchApi(`/api/agentes/${id}/qr`)
        if (cancelled) return
        if (data?.conectado) {
          setBotConectado(true)
          setBotNumero(data.numero || '')
          setBotPerfil(data.perfil || '')
        } else {
          setQrBase64(data?.base64 || null)
        }
      } finally {
        if (!cancelled) setQrCargando(false)
      }
    }
    cargarQR()
    const interval = setInterval(cargarQR, 8000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [wizardPaso, botConectado, id, qrRefreshKey])

  useEffect(() => {
    if (['ventas', 'cartera', 'citas'].includes(tipoAgente)) {
      setPersonalidadTipo(tipoAgente)
    }
  }, [tipoAgente])

  function handlePersonalidadTipo(tipo: string) {
    setPersonalidadTipo(tipo)
    if (tipo) setConfig(prev => ({ ...prev, personalidad: buildPrompt(tipo, prev.nombre_empresa, prev.nombre_agente) }))
  }

  function regenerarPromptSiTipo(campo: 'nombre_empresa' | 'nombre_agente', valor: string) {
    setConfig(prev => {
      const next = { ...prev, [campo]: valor }
      if (personalidadTipo) next.personalidad = buildPrompt(personalidadTipo, next.nombre_empresa, next.nombre_agente)
      return next
    })
  }

  function toggleCaracteristica(item: string) {
    setCaracteristicas(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item])
  }

  async function handleCambiarNumero() {
    if (!confirm('¿Desconectar el número actual y escanear uno nuevo?')) return
    setCambiandoNumero(true)
    try {
      await fetchApi(`/api/agentes/${id}/logout`, { method: 'DELETE' })
    } catch {}
    setBotConectado(false)
    setBotNumero('')
    setBotPerfil('')
    setQrBase64(null)
    setQrRefreshKey(k => k + 1)
    setCambiandoNumero(false)
  }

  function irAPaso(paso: number) {
    // Proteger paso 7: solo si se alcanzó el paso 6
    if (paso === 7 && maxPasoAlcanzado < 6) return
    setWizardPaso(paso)
  }

  function avanzar() {
    const siguientePaso = wizardPaso + 1
    if (wizardPaso === 1) setPerfilGuardado(true)
    setWizardPaso(siguientePaso)
    setMaxPasoAlcanzado(prev => Math.max(prev, siguientePaso))
  }

  async function handleGenerarKB() {
    setGenerandoKB(true)
    const res = await fetch('/api/agentes/analizar-documento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textoDocumento:  conocimientoBase,
        nombreAgente:    config.nombre_agente,
        nombreEmpresa:   config.nombre_empresa,
        personalidadTipo,
      }),
    })
    const data = await res.json()
    if (data.texto) setConocimientoBase(data.texto)
    else alert(data.error || 'Error analizando documento')
    setGenerandoKB(false)
  }

  async function handleAnalizarImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalizandoImg(true)
    setImgMsg('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/demo/analizar', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.data) {
        const d = data.data
        setPrimerProducto(prev => ({
          ...prev,
          nombre: d.producto || prev.nombre,
          caracteristicas: [d.marca, d.talla, d.descripcion].filter(Boolean).join(' · ') || prev.caracteristicas,
          precio: d.precio || prev.precio,
        }))
        setImgMsg('✅ Campos completados. Puedes editarlos antes de continuar.')
      } else {
        setImgMsg('No se pudo analizar, completa manualmente.')
      }
    } catch {
      setImgMsg('No se pudo analizar, completa manualmente.')
    }
    setAnalizandoImg(false)
    e.target.value = ''
  }

  async function handleSubirKB(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoKB(true)
    const formData = new FormData()
    formData.append('archivo', file)
    const res  = await fetch('/api/extraer-texto', { method: 'POST', body: formData })
    const data = await res.json()
    setSubiendoKB(false)
    if (!data.texto) { alert(data.error || 'Error extrayendo texto del archivo'); return }
    setGenerandoKB(true)
    const res2 = await fetch('/api/agentes/analizar-documento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textoDocumento:  data.texto,
        nombreAgente:    config.nombre_agente,
        nombreEmpresa:   config.nombre_empresa,
        personalidadTipo,
      }),
    })
    const data2 = await res2.json()
    if (data2.texto) setConocimientoBase(data2.texto)
    else { setConocimientoBase(data.texto); alert(data2.error || 'Error analizando documento') }
    setKbNombre(file.name)
    setGenerandoKB(false)
  }

  async function handleGuardar() {
    if (config.numero_escalado && !numeroEscaladoValido) return
    setSaving(true)
    let personalidadFinal = config.personalidad
    if (caracteristicas.length > 0) {
      personalidadFinal += `\n\nInformación operativa del negocio:\n- ${caracteristicas.join('\n- ')}`
    }
    const data = await fetchApi(`/api/agentes/${id}/configurar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          ...config,
          personalidad:      personalidadFinal,
          conocimiento_base: conocimientoBase,
          caracteristicas:   JSON.stringify(caracteristicas),
          condiciones:       JSON.stringify(condiciones),
          tipo:                          tipoAgente || personalidadTipo || 'ventas',
          tipo_negocio:                  tipoNegocio,
          posventa_activa:               config.posventa_activa,
          posventa_mensaje_bienvenida:   config.posventa_mensaje_bienvenida,
          posventa_intentos_cancelacion: config.posventa_intentos_cancelacion,
          posventa_mensaje_seguimiento:  config.posventa_mensaje_seguimiento,
          primerProducto,
        },
        faq,
      }),
    })
    if (data?.ok) {
      setSaved(true)
      await update()
      setTimeout(() => router.push(backHref), 1500)
    } else {
      console.error('[handleGuardar] Error al guardar:', data)
      alert(data?.error || 'Error al guardar la configuración')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-zinc-500">Cargando...</div>


  const paso1Bloqueado = !perfilGuardado && (!tipoAgente || (tipoAgente === 'ventas' && !tipoNegocio))

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.push(backHref)}
          className="text-zinc-500 hover:text-white text-sm mb-3 transition-colors">
          ← Mis agentes
        </button>

        {/* Stepper */}
        <div className="mt-6">
          <div className="flex items-center">
            {WIZARD_PASOS.map((_, i) => {
              const pasoNum = i + 1
              const completado = wizardPaso > pasoNum
              const activo = wizardPaso === pasoNum
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  {/* Círculo */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    backgroundColor: completado ? '#059669' : activo ? '#ffffff' : '#27272a',
                    color: completado ? '#ffffff' : activo ? '#000000' : '#71717a',
                    boxShadow: activo ? '0 0 0 3px rgba(5,150,105,0.3)' : 'none',
                  }}>
                    {completado ? '✓' : pasoNum}
                  </div>
                  {/* Línea conectora (no renderizar después del último) */}
                  {i < WIZARD_PASOS.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: completado ? '#059669' : '#27272a',
                      transition: 'background-color 0.2s',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-center">
            <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, margin: 0 }}>
              {WIZARD_PASOS[wizardPaso - 1]}
            </p>
            <p style={{ color: '#71717a', fontSize: 12, margin: '2px 0 0' }}>
              Paso {wizardPaso} de 7
            </p>
          </div>
        </div>
      </div>

      {/* ── PASO 1: Perfil ── */}
      {wizardPaso === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">¿Para qué usarás el agente?</p>
            <p className="text-zinc-500 text-sm mt-0.5">
              {perfilGuardado ? 'Perfil configurado' : 'Elige el perfil que mejor describe tu caso de uso'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { key: 'ventas',  icon: '🛍️', titulo: 'Ventas',  desc: 'Vende tus productos o servicios 24/7 con IA',               casos: 'Tiendas, restaurantes, distribuidoras' },
              { key: 'cartera', icon: '💰', titulo: 'Cartera', desc: 'Cobra deudas y recordatorios automáticos por WhatsApp',     casos: 'Distribuidoras, créditos, carteras' },
              { key: 'citas',   icon: '📅', titulo: 'Citas',   desc: 'Agenda citas con recordatorios y cancelaciones automáticas', casos: 'Médicos, abogados, consultores, spas' },
            ].map(({ key, icon, titulo, desc, casos }) => (
              <button key={key}
                onClick={() => { if (!perfilGuardado) { setTipoAgente(key); if (key !== 'ventas') setTipoNegocio(null) } }}
                className={
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all " +
                  (tipoAgente === key
                    ? "border-emerald-500 bg-emerald-500/10"
                    : perfilGuardado
                      ? "border-zinc-800 bg-zinc-900 opacity-30 pointer-events-none cursor-default"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600")
                }>
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white">{titulo}</p>
                  <p className="text-xs text-zinc-400">{desc}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{casos}</p>
                </div>
                {tipoAgente === key && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs leading-none">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          {tipoAgente === 'ventas' && (
            <div className="space-y-2 pt-1">
              <p className="text-zinc-300 text-sm font-medium">¿Qué tipo de negocio tienes?</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'productos', icon: '📦', label: 'Productos' },
                  { key: 'servicios', icon: '🛠️', label: 'Servicios' },
                ] as { key: 'productos' | 'servicios', icon: string, label: string }[]).map(({ key, icon, label }) => (
                  <button key={key}
                    onClick={() => { if (!perfilGuardado) setTipoNegocio(key) }}
                    className={
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all " +
                      (tipoNegocio === key
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : perfilGuardado
                          ? "border-zinc-800 bg-zinc-900 text-zinc-400 opacity-30 pointer-events-none cursor-default"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600")
                    }>
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 2: Identidad y personalidad ── */}
      {wizardPaso === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Identidad del agente</p>
            <p className="text-zinc-500 text-sm mt-0.5">Define quién es tu agente y cómo se comportará</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Nombre de la empresa</label>
              <input
                value={config.nombre_empresa}
                onChange={e => regenerarPromptSiTipo('nombre_empresa', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Ej: Mi Empresa" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1.5 block">Nombre del agente</label>
              <input
                value={config.nombre_agente}
                onChange={e => regenerarPromptSiTipo('nombre_agente', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Ej: Sofía" />
              {perfilGuardado && (
                <p className="text-yellow-400 text-xs mt-1.5">
                  ⚠️ Cambiar el nombre puede confundir clientes que ya conversaron con este agente
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 text-xs">Instrucciones del agente</label>
              {personalidadTipo && (
                <button
                  onClick={() => setConfig(prev => ({ ...prev, personalidad: buildPrompt(personalidadTipo, prev.nombre_empresa, prev.nombre_agente) }))}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  ↺ Regenerar prompt
                </button>
              )}
            </div>
            <textarea
              value={config.personalidad}
              onChange={e => setConfig({ ...config, personalidad: e.target.value })}
              rows={7}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Selecciona un tipo arriba para generar un prompt, o escribe las instrucciones manualmente..." />
          </div>
        </div>
      )}

      {/* ── PASO 3: Características del negocio ── */}
      {wizardPaso === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Características del negocio</p>
            <p className="text-zinc-500 text-sm mt-0.5">Selecciona las que aplican — se añadirán al prompt del agente automáticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {getCaracteristicasGrupos(tipoAgente, tipoNegocio).map(({ grupo, items }) => (
              <div key={grupo} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-300 text-xs font-semibold mb-3">{grupo}</p>
                <div className="space-y-2.5">
                  {items.map(item => (
                    <label key={item} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleCaracteristica(item)}>
                      <div className={"w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 " +
                        (caracteristicas.includes(item)
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-zinc-600 group-hover:border-zinc-400")}>
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
            <p className="text-zinc-500 text-xs">
              {caracteristicas.length} característica{caracteristicas.length !== 1 ? 's' : ''} seleccionada{caracteristicas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── PASO 4: Conocimiento base ── */}
      {wizardPaso === 4 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Conocimiento base</p>
            <p className="text-zinc-500 text-sm mt-0.5">Información que el agente usará para responder con precisión</p>
          </div>

          {(tipoNegocio === 'productos' || tipoNegocio === 'servicios') ? (
            /* Formulario de primer producto/servicio */
            <div className="space-y-4">
              <p className="text-zinc-300 text-sm font-medium">
                {tipoNegocio === 'productos' ? 'Agrega tu primer producto' : 'Agrega tu primer servicio'}
              </p>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleAnalizarImagen} />
              <button
                onClick={() => { setImgMsg(''); imgRef.current?.click() }}
                disabled={analizandoImg}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-zinc-700">
                {analizandoImg
                  ? <><span className="animate-spin inline-block">↻</span> Analizando imagen...</>
                  : '📷 Analizar imagen'}
              </button>
              {imgMsg && (
                <p className={`text-xs ${imgMsg.startsWith('✅') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {imgMsg}
                </p>
              )}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 4fr' }}>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1.5 block">Código</label>
                    <input
                      value={primerProducto.codigo}
                      onChange={e => setPrimerProducto(prev => ({ ...prev, codigo: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: SKU-001" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1.5 block">Nombre</label>
                    <input
                      value={primerProducto.nombre}
                      onChange={e => setPrimerProducto(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      placeholder={tipoNegocio === 'productos' ? 'Ej: Camisa talla M' : 'Ej: Consultoría básica'} />
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Características</label>
                  <textarea
                    value={primerProducto.caracteristicas}
                    onChange={e => setPrimerProducto(prev => ({ ...prev, caracteristicas: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder={tipoNegocio === 'productos' ? 'Ej: Color azul, tela 100% algodón, talla M' : 'Ej: Incluye 2 horas de asesoría, informe final, seguimiento 30 días'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1.5 block">
                      {tipoNegocio === 'productos' ? 'Cantidad en stock' : 'Cupos disponibles'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={primerProducto.cantidad}
                      onChange={e => setPrimerProducto(prev => ({ ...prev, cantidad: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: 50" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1.5 block">Precio</label>
                    <input
                      value={primerProducto.precio}
                      onChange={e => setPrimerProducto(prev => ({ ...prev, precio: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: 49.900" />
                  </div>
                </div>
              </div>
              <p className="text-zinc-500 text-xs">
                Para cargar más {tipoNegocio === 'productos' ? 'productos' : 'servicios'} ve al módulo de{' '}
                <span className="text-zinc-400">
                  {tipoNegocio === 'productos' ? 'Productos' : 'Servicios'}
                </span>.
              </p>
            </div>
          ) : (
            /* Conocimiento libre para cartera, citas u otros */
            <>
              <div className="flex gap-3">
                <div className={kbNombre ? 'w-full' : 'flex-1'}>
                  <input ref={kbRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleSubirKB} />
                  <button
                    onClick={() => kbRef.current?.click()}
                    disabled={subiendoKB || generandoKB}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-zinc-700">
                    {subiendoKB ? <><span className="animate-spin inline-block">↻</span> Extrayendo...</>
                      : generandoKB ? <><span className="animate-spin inline-block">↻</span> Analizando documento...</>
                      : '📎 Subir PDF / DOCX / TXT'}
                  </button>
                </div>
                {!kbNombre && (
                  <button
                    onClick={handleGenerarKB}
                    disabled={generandoKB || subiendoKB}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                    {generandoKB ? <><span className="animate-spin inline-block">↻</span> Analizando documento...</> : '🤖 Generar con IA'}
                  </button>
                )}
              </div>

              {kbNombre && <p className="text-emerald-400 text-xs">✅ {kbNombre}</p>}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-400 text-xs">Contenido del conocimiento base</label>
                  {conocimientoBase && (
                    <span className="text-zinc-600 text-xs">{conocimientoBase.length} caracteres</span>
                  )}
                </div>
                <textarea
                  value={conocimientoBase}
                  onChange={e => setConocimientoBase(e.target.value)}
                  rows={12}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Usa los botones de arriba para generar o cargar el conocimiento base, o escríbelo manualmente..." />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PASO 5: FAQ & Escalado ── */}
      {wizardPaso === 5 && (
        <div className="space-y-6">
          <div>
            <p className="text-white font-semibold">Escalado y preguntas frecuentes</p>
            <p className="text-zinc-500 text-sm mt-0.5">Configura a dónde escalar conversaciones y las respuestas automáticas</p>
          </div>

          {/* Número escalado */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-zinc-300 text-sm font-semibold">📞 Número de escalado</p>
            <p className="text-zinc-500 text-xs">Cuando el agente no pueda resolver algo, enviará la conversación a este número</p>
            <PhoneInput
              value={config.numero_escalado}
              onChange={v => setConfig({ ...config, numero_escalado: v })}
              onValidChange={setNumeroEscaladoValido}
              checkWhatsapp />
          </div>

          {/* Toggle activo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig({ ...config, activo: !config.activo })}
              className={"w-10 h-6 rounded-full transition-all relative " + (config.activo ? "bg-emerald-500" : "bg-zinc-700")}>
              <div className={"w-4 h-4 bg-white rounded-full absolute top-1 transition-all " + (config.activo ? "left-5" : "left-1")} />
            </button>
            <span className="text-zinc-400 text-sm">{config.activo ? 'Agente activo' : 'Agente pausado'}</span>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <p className="text-zinc-300 text-sm font-semibold">💬 Preguntas frecuentes</p>
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    value={item.pregunta}
                    onChange={e => setFaq(prev => prev.map((p, j) => j === i ? { ...p, pregunta: e.target.value } : p))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="¿Pregunta frecuente?" />
                  <button
                    onClick={() => setFaq(prev => prev.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 text-sm transition-colors pt-2">✕</button>
                </div>
                <textarea
                  value={item.respuesta}
                  onChange={e => setFaq(prev => prev.map((p, j) => j === i ? { ...p, respuesta: e.target.value } : p))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Respuesta..." />
              </div>
            ))}
            <button
              onClick={() => setFaq(prev => [...prev, { pregunta: '', respuesta: '' }])}
              className="w-full py-3 border border-dashed border-zinc-700 hover:border-emerald-500 text-zinc-500 hover:text-emerald-400 rounded-xl text-sm transition-colors">
              + Agregar pregunta frecuente
            </button>
          </div>

          {/* Condiciones de venta */}
          <div className="space-y-3">
            <p className="text-zinc-300 text-sm font-semibold">📋 Condiciones de venta</p>
            {condiciones.map((item, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    value={item.titulo}
                    onChange={e => setCondiciones(prev => prev.map((c, j) => j === i ? { ...c, titulo: e.target.value } : c))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Título (ej: Política de devoluciones)" />
                  <button
                    onClick={() => setCondiciones(prev => prev.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 text-sm transition-colors pt-2">✕</button>
                </div>
                <textarea
                  value={item.descripcion}
                  onChange={e => setCondiciones(prev => prev.map((c, j) => j === i ? { ...c, descripcion: e.target.value } : c))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Descripción de la condición..." />
              </div>
            ))}
            <button
              onClick={() => setCondiciones(prev => [...prev, { titulo: '', descripcion: '' }])}
              className="w-full py-3 border border-dashed border-zinc-700 hover:border-emerald-500 text-zinc-500 hover:text-emerald-400 rounded-xl text-sm transition-colors">
              + Agregar condición de venta
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 6: Posventa ── */}
      {wizardPaso === 6 && (
        <div className="space-y-6">
          <div>
            <p className="text-white font-semibold">
              {tipoAgente === 'cartera' ? 'Seguimiento post-contacto'
                : tipoAgente === 'citas' ? 'Gestión de cancelaciones y reagendamiento'
                : 'Posventa automática'}
            </p>
            <p className="text-zinc-500 text-sm mt-0.5">
              {tipoAgente === 'cartera'
                ? 'Gestión automática de recordatorios y acuerdos de pago'
                : tipoAgente === 'citas'
                ? 'Manejo automático de cancelaciones y cambios de cita'
                : 'Cuando un cliente escriba después de comprar, el agente gestionará su pedido'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfig(prev => ({ ...prev, posventa_activa: !prev.posventa_activa }))}
                className={"w-10 h-6 rounded-full transition-all relative " + (config.posventa_activa ? "bg-emerald-500" : "bg-zinc-700")}>
                <div className={"w-4 h-4 bg-white rounded-full absolute top-1 transition-all " + (config.posventa_activa ? "left-5" : "left-1")} />
              </button>
              <span className="text-zinc-400 text-sm">
                {config.posventa_activa
                  ? (tipoAgente === 'cartera' ? '¿Activar seguimiento?'
                    : tipoAgente === 'citas' ? '¿Activar gestión automática?'
                    : '¿Activar posventa?')
                  : (tipoAgente === 'cartera' ? 'Seguimiento desactivado'
                    : tipoAgente === 'citas' ? 'Gestión automática desactivada'
                    : 'Posventa desactivada')}
              </span>
            </div>
            {config.posventa_activa && (
              <button
                onClick={async () => {
                  setSugiriendo(true)
                  const res = await fetch('/api/agentes/sugerir-posventa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      botId: id,
                      nombre_empresa: config.nombre_empresa,
                      nombre_agente: config.nombre_agente,
                      personalidad: config.personalidad,
                      tipo_negocio: 'productos',
                      caracteristicas: JSON.stringify(caracteristicas),
                      condiciones: JSON.stringify(condiciones),
                      tipoAgente,
                    }),
                  })
                  const data = await res.json()
                  if (data.mensaje_bienvenida) {
                    setConfig(prev => ({
                      ...prev,
                      posventa_mensaje_bienvenida: data.mensaje_bienvenida,
                      posventa_mensaje_seguimiento: data.mensaje_seguimiento || prev.posventa_mensaje_seguimiento,
                      posventa_intentos_cancelacion: data.intentos ?? prev.posventa_intentos_cancelacion,
                    }))
                  }
                  setSugiriendo(false)
                }}
                disabled={sugiriendo}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                {sugiriendo
                  ? <><span className="animate-spin inline-block text-sm">↻</span> Analizando tu negocio...</>
                  : (config.posventa_mensaje_bienvenida ? '✨ Regenerar' : '✨ Sugerir con IA')}
              </button>
            )}
          </div>

          {config.posventa_activa && (
            <div className="space-y-5">
              {/* Campo 1: mensaje principal */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">
                  {tipoAgente === 'cartera'
                    ? 'Mensaje de recordatorio de pago'
                    : tipoAgente === 'citas'
                    ? 'Mensaje de confirmación de cita'
                    : 'Mensaje de bienvenida posventa'}
                </label>
                <textarea
                  value={config.posventa_mensaje_bienvenida}
                  onChange={e => setConfig(prev => ({ ...prev, posventa_mensaje_bienvenida: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder={
                    tipoAgente === 'cartera'
                      ? 'Hola {nombre}, te recordamos que tienes un saldo pendiente de {valor}.'
                      : tipoAgente === 'citas'
                      ? 'Hola {nombre}, tu cita está confirmada para el {fecha}.'
                      : 'Hola {nombre}, veo que tienes un pedido de {producto}. ¿En qué puedo ayudarte?'
                  } />
              </div>

              {/* Campo 2: select numérico */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">
                  {tipoAgente === 'cartera'
                    ? 'Días entre recordatorios'
                    : tipoAgente === 'citas'
                    ? 'Horas antes del recordatorio'
                    : 'Intentos antes de aceptar cancelación'}
                </label>
                <select
                  value={config.posventa_intentos_cancelacion}
                  onChange={e => setConfig(prev => ({ ...prev, posventa_intentos_cancelacion: Number(e.target.value) }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                  {tipoAgente === 'cartera'
                    ? [1, 2, 3, 5, 7].map(n => <option key={n} value={n}>{n} {n === 1 ? 'día' : 'días'}</option>)
                    : tipoAgente === 'citas'
                    ? [24, 12, 2].map(n => <option key={n} value={n}>{n} horas antes</option>)
                    : [1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'vez' : 'veces'}</option>)}
                </select>
              </div>

              {/* Campo 3: mensaje secundario */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">
                  {tipoAgente === 'cartera'
                    ? 'Mensaje al recibir pago (agradecimiento)'
                    : tipoAgente === 'citas'
                    ? 'Mensaje de reagendamiento'
                    : <span>Mensaje post-entrega <span className="text-zinc-600">(opcional)</span></span>}
                </label>
                <textarea
                  value={config.posventa_mensaje_seguimiento}
                  onChange={e => setConfig(prev => ({ ...prev, posventa_mensaje_seguimiento: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder={
                    tipoAgente === 'cartera'
                      ? '¡Gracias {nombre}! Hemos recibido tu pago. ¡Todo al día!'
                      : tipoAgente === 'citas'
                      ? 'Entiendo, podemos reagendar tu cita. ¿Qué día te viene mejor?'
                      : '¡Hola! ¿Cómo te fue con tu pedido? ¿Quedaste satisfecho?'
                  } />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 7: Conectar QR ── */}
      {wizardPaso === 7 && (
        <div className="space-y-5">
          <div>
            <p className="text-white font-semibold">Conectar WhatsApp</p>
            <p className="text-zinc-500 text-sm mt-0.5">Escanea el código QR con tu WhatsApp para vincular el agente</p>
          </div>
          {botConectado ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-950 border border-emerald-700 rounded-xl p-5">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-emerald-400 font-semibold text-sm">Número conectado</p>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Conectado
                    </span>
                  </div>
                  {botNumero && (
                    <p className="text-zinc-300 text-sm font-mono mt-1">
                      +{botNumero}{botPerfil ? ` · ${botPerfil}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCambiarNumero}
                disabled={cambiandoNumero}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white text-sm font-semibold py-2.5 rounded-xl border border-zinc-700 transition-colors">
                {cambiandoNumero
                  ? <><span className="animate-spin inline-block">↻</span> Desconectando...</>
                  : '🔄 Cambiar número'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {qrCargando && !qrBase64 ? (
                <div className="w-56 h-56 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center">
                  <span className="text-zinc-500 text-sm animate-pulse">Cargando QR...</span>
                </div>
              ) : qrBase64 ? (
                <img src={qrBase64} alt="QR WhatsApp" className="w-56 h-56 rounded-xl border border-zinc-700" />
              ) : (
                <div className="w-56 h-56 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center">
                  <span className="text-zinc-500 text-sm text-center px-4">No se pudo obtener el QR</span>
                </div>
              )}
              <button
                onClick={() => setQrRefreshKey(k => k + 1)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                ↺ Actualizar QR
              </button>
              <p className="text-zinc-500 text-xs text-center">
                Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Navegación ── */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
        {wizardPaso > 1 && (
          <button
            onClick={() => setWizardPaso(p => p - 1)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            ← Atrás
          </button>
        )}
        {wizardPaso < 7 ? (
          <button
            onClick={avanzar}
            disabled={wizardPaso === 1 && paso1Bloqueado}
            className={"flex-1 text-sm font-semibold py-3 rounded-xl transition-colors text-white " +
              (wizardPaso === 1 && paso1Bloqueado
                ? "bg-zinc-700 opacity-50 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500")}>
            Siguiente →
          </button>
        ) : (
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            {saving ? 'Guardando...' : '✅ Guardar y activar'}
          </button>
        )}
      </div>

    </div>
  )
}

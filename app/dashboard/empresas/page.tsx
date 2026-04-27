'use client'
import { fetchApi, errorMsg } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/components/PhoneInput'

const PLANES = [
  { id: 'basico', label: 'Básico' },
  { id: 'pro', label: 'Pro' },
  { id: 'business', label: 'Business' },
]
const PASOS = [
  { id: 1, label: 'Validar nombre de empresa' },
  { id: 2, label: 'Configurando base de datos' },
  { id: 3, label: 'Configurando canal de mensajería' },
  { id: 4, label: 'Actualizar agente (index.js)' },
  { id: 5, label: 'Crear carpetas de media' },
  { id: 6, label: 'Crear usuario en el panel' },
  { id: 7, label: 'Rebuild del agente' },
]
type EstadoPaso = 'pendiente' | 'cargando' | 'ok' | 'error'

function dias(fin: string | null) {
  if (!fin) return null
  return Math.ceil((new Date(fin).getTime() - Date.now()) / 86400000)
}

export default function EmpresasPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<any>(null)
  const [modalPlan, setModalPlan] = useState<any>(null)
  const [modalPass, setModalPass] = useState<any>(null)
  const [modalEliminar, setModalEliminar] = useState<any>(null)
  const [confirmTexto, setConfirmTexto] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [modalOnb, setModalOnb] = useState(false)
  const [planSel, setPlanSel] = useState('basico')
  const [periSel, setPeriSel] = useState('mensual')
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [onbNombre, setOnbNombre] = useState('')
  const [onbNumero, setOnbNumero] = useState('')
  const [onbNumeroValido, setOnbNumeroValido] = useState(false)
  const [onbPlan, setOnbPlan] = useState('basico')
  const [onbTipo, setOnbTipo] = useState('productos')
  const [wizardPaso, setWizardPaso] = useState(1)
  const [pasos, setPasos] = useState<EstadoPaso[]>(PASOS.map(() => 'pendiente'))
  const [onbLoading, setOnbLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [onbResult, setOnbResult] = useState<any>(null)

  useEffect(() => {
    if (user?.role !== 'admin') { router.push('/dashboard'); return }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const data = await fetchApi('/api/empresas/stats')
    setEmpresas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function renovar() {
    await fetchApi(`/api/empresas/${modalPlan.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planSel, periodicidad: periSel, meses: periSel === 'anual' ? 12 : 1 })
    })
    setModalPlan(null); load()
  }

  async function eliminarEmpresa() {
    if (!modalEliminar || confirmTexto !== 'eliminar') return
    setEliminando(true)
    const resEliminar = await fetchApi(`/api/empresas/${modalEliminar.id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar_empresa' })
    })
    if (!resEliminar) { alert('Error al eliminar empresa'); return }
    setEliminando(false); setModalEliminar(null); setConfirmTexto(''); setSel(null); load()
  }
  async function toggle(e: any) {
    await fetchApi(`/api/empresas/${e.id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: e.planActivo ? 'deshabilitar' : 'habilitar' })
    })
    load()
    if (sel?.id === e.id) setSel({ ...sel, planActivo: !e.planActivo })
  }

  async function resetPass() {
    if (!newPass || newPass.length < 6) { setPassMsg('Mínimo 6 caracteres'); return }
    const res = await fetchApi(`/api/empresas/${modalPass.id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'reset_password', password: newPass })
    })
    const data = res
    setPassMsg(data.ok ? '✅ Contraseña actualizada' : 'Error al actualizar')
    if (data.ok) setNewPass('')
  }

  async function onboarding() {
    if (!onbNombre || !onbNumero || !onbNumeroValido) return
    setOnbLoading(true); setPasos(PASOS.map(() => 'pendiente')); setOnbResult(null)
    try {
      const r = await fetch('/api/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: onbNombre, numero: onbNumero, plan: onbPlan, tipoNegocio: onbTipo })
      })
      if (!r.body) throw new Error('Sin stream')
      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'paso') {
              flushSync(() => {
                setPasos(prev => { const next = [...prev]; next[ev.index] = ev.estado as EstadoPaso; return next })
              })
            } else if (ev.type === 'done') {
              flushSync(() => {
                setOnbResult({ done: true, email: ev.email, password: ev.password })
              })
              load()
            } else if (ev.type === 'error') {
              flushSync(() => {
                if (ev.index >= 0) setPasos(prev => { const next = [...prev]; next[ev.index] = 'error'; return next })
                setOnbResult({ done: false, error: ev.message })
              })
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setOnbResult({ done: false, error: 'Error de conexión: ' + e.message })
    } finally {
      setOnbLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-zinc-400">Cargando...</div>

  if (sel) {
    const d = dias(sel.planFin)
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setSel(null)} className="text-zinc-400 text-sm mb-6 hover:text-white">← Volver</button>
        <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{sel.name}</h1>
            <p className="text-zinc-500 text-sm">{sel.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggle(sel)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${sel.planActivo ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {sel.planActivo ? '⛔ Deshabilitar' : '✅ Habilitar'}
            </button>
            <button onClick={() => { setConfirmTexto(''); setModalEliminar(sel) }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30">
              🗑️ Eliminar empresa
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[['Plan', sel.plan?.toUpperCase()], ['Estado', sel.planActivo ? '✅ Activo' : '⛔ Inactivo'], ['Vence', sel.planFin ? new Date(sel.planFin).toLocaleDateString('es-CO') : '—'], ['Días', d !== null ? (d <= 0 ? 'Vencido' : `${d} días`) : '—']].map(([l, v]) => (
            <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-zinc-500 text-xs mb-1">{l}</div>
              <div className="text-white font-semibold text-sm">{v}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[['📅', 'Hoy', sel.ventas?.hoy ?? 0], ['📆', 'Este mes', sel.ventas?.mes ?? 0], ['📊', 'Este año', sel.ventas?.anio ?? 0], ['💰', 'Total', sel.ventas?.total ?? 0]].map(([ico, l, v]) => (
            <div key={String(l)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xl mb-1">{ico}</div>
              <div className="text-2xl font-bold text-white">{v}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-4">
          <div className="px-5 py-3 border-b border-zinc-800 text-white font-semibold text-sm">Agentes</div>
          {sel.bots?.map((b: any) => (
            <div key={b.id} className="px-5 py-3 border-b border-zinc-800 last:border-0 flex flex-wrap gap-2 items-center justify-between">
              <div>
                <div className="text-white text-sm font-medium">{b.name}</div>
                <div className="text-zinc-500 text-xs font-mono">{b.instance}</div>
                {b.numero && <div className="text-emerald-400 text-xs">+{b.numero}</div>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  [b.activo, '● Activo', '○ Inactivo'],
                  [b.configurado, '✓ Config', '✗ Sin config'],
                  [b.numero, '📱 Conectado', '📵 Desconectado'],
                ].map(([cond, si, no]: any, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cond ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{cond ? si : no}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {sel.ultimasVentas?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-3 border-b border-zinc-800 text-white font-semibold text-sm">Últimas ventas</div>
            {sel.ultimasVentas.map((v: any) => (
              <div key={v.id} className="px-5 py-3 border-b border-zinc-800 last:border-0 flex justify-between gap-4">
                <div>
                  <div className="text-white text-sm">{v.cliente}</div>
                  <div className="text-zinc-500 text-xs font-mono">{v.instance}</div>
                  <div className="text-zinc-400 text-xs mt-1">{v.resumen?.slice(0, 80)}</div>
                </div>
                <div className="text-zinc-500 text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleDateString('es-CO')}</div>
              </div>
            ))}
          </div>
        )}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="text-center">
              <p className="text-4xl mb-2">⚠️</p>
              <h3 className="text-white font-bold text-lg">Eliminar empresa</h3>
              <p className="text-zinc-400 text-sm mt-1">Acción irreversible. Todos los datos de <span className="text-white font-semibold">{modalEliminar?.name}</span> serán eliminados.</p>
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold block mb-2">Escribe <span className="text-red-400 font-bold">eliminar</span> para confirmar</label>
              <input value={confirmTexto} onChange={e => setConfirmTexto(e.target.value)} placeholder="eliminar" className="w-full bg-zinc-800 border border-red-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setModalEliminar(null); setConfirmTexto('') }} className="flex-1 bg-zinc-800 text-white text-sm py-3 rounded-xl">Cancelar</button>
              <button onClick={eliminarEmpresa} disabled={confirmTexto !== 'eliminar' || eliminando} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl">
                {eliminando ? 'Eliminando...' : 'Eliminar empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{empresas.length} empresas registradas</p>
        </div>
        <button onClick={() => setModalOnb(true)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2 rounded-xl">+ Nueva empresa</button>
      </div>
      <div className="space-y-3">
        {empresas.map(e => {
          const d = dias(e.planFin)
          const botsActivos = e.bots?.filter((b: any) => b.activo).length ?? 0
          const botsConectados = e.bots?.filter((b: any) => b.numero).length ?? 0
          const limitePlan = e.plan === 'basico' ? 1 : e.plan === 'pro' ? 2 : e.plan === 'business' ? 3 : 1
          return (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex flex-wrap gap-4 items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">{e.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="text-white font-semibold">{e.name}</div>
                    <div className="text-zinc-500 text-xs">{e.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-semibold uppercase">{e.plan}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.planActivo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{e.planActivo ? 'Activo' : 'Inactivo'}</span>
                  {d !== null && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d <= 0 ? 'bg-red-500/15 text-red-400' : d <= 10 ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>{d <= 0 ? 'Vencido' : `${d}d`}</span>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[['Agentes activos', `${botsActivos}/${limitePlan}`], ['Conectados', botsConectados], ['Ventas hoy', e.ventas?.hoy ?? 0], ['Ventas mes', e.ventas?.mes ?? 0]].map(([l, v]) => (
                  <div key={String(l)} className="bg-zinc-800/50 rounded-xl p-3 text-center">
                    <div className="text-white font-bold text-lg">{v}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSel(e)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">Ver detalle</button>
                <button onClick={() => { setPlanSel(e.plan); setPeriSel(e.periodicidad || 'mensual'); setModalPlan(e) }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">↺ Renovar</button>
                <button onClick={() => { setModalPass(e); setPassMsg('') }} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg">🔑 Contraseña</button>
              </div>
            </div>
          )
        })}
      </div>

      {modalPlan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-4">Renovar — {modalPlan.name}</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PLANES.map(p => <button key={p.id} onClick={() => setPlanSel(p.id)} className={`py-2 rounded-lg text-xs font-semibold border ${planSel === p.id ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-800 border-zinc-700 text-white'}`}>{p.label}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['mensual', 'anual'].map(p => <button key={p} onClick={() => setPeriSel(p)} className={`py-2 rounded-lg text-xs font-semibold border capitalize ${periSel === p ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-800 border-zinc-700 text-white'}`}>{p}</button>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalPlan(null)} className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-xl">Cancelar</button>
              <button onClick={renovar} className="flex-1 bg-emerald-500 text-black font-semibold text-sm py-2 rounded-xl">Renovar</button>
            </div>
          </div>
        </div>
      )}

      {modalPass && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold mb-1">Reset contraseña</h3>
            <p className="text-zinc-400 text-sm mb-4">{modalPass.email}</p>
            <div className="relative mb-3">
              <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nueva contraseña (mín. 6 caracteres)" type={showPass ? 'text' : 'password'} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 pr-10 text-white text-sm outline-none focus:border-emerald-500" />
              <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                {showPass
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {passMsg && <p className={`text-sm mb-3 ${passMsg.includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{passMsg}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setModalPass(null); setPassMsg(''); setNewPass('') }} className="flex-1 bg-zinc-800 text-white text-sm py-2 rounded-xl">Cerrar</button>
              <button onClick={resetPass} className="flex-1 bg-emerald-500 text-black font-semibold text-sm py-2 rounded-xl">Actualizar</button>
            </div>
          </div>
        </div>
      )}

      {modalOnb && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            {!onbLoading && !onbResult && (
              <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold text-lg">Nueva empresa</h3>
                  <span className="text-zinc-500 text-xs">{wizardPaso}/3</span>
                </div>
                <div className="flex gap-1 mt-3">
                  {[1,2,3].map(s => (
                    <div key={s} className={"h-1 flex-1 rounded-full transition-colors " + (wizardPaso >= s ? "bg-emerald-500" : "bg-zinc-700")} />
                  ))}
                </div>
              </div>
            )}
            <div className="p-6">
              {!onbLoading && !onbResult && wizardPaso === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-white font-semibold mb-1">Tipo de negocio</p>
                    <p className="text-zinc-400 text-sm">Define como funcionara el agente</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => setOnbTipo('productos')}
                      className={"p-4 rounded-2xl border-2 text-left transition-all " + (onbTipo === 'productos' ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-800")}>
                      <div className="text-2xl mb-2">📦</div>
                      <div className="text-white font-semibold text-sm">Productos</div>
                      <div className="text-zinc-400 text-xs mt-0.5">Catalogo e inventario</div>
                    </button>
                    <button onClick={() => setOnbTipo('servicios')}
                      className={"p-4 rounded-2xl border-2 text-left transition-all " + (onbTipo === 'servicios' ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-800")}>
                      <div className="text-2xl mb-2">🛠️</div>
                      <div className="text-white font-semibold text-sm">Servicios</div>
                      <div className="text-zinc-400 text-xs mt-0.5">Citas y cotizaciones</div>
                    </button>
                  </div>
                </div>
              )}
              {!onbLoading && !onbResult && wizardPaso === 2 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-white font-semibold mb-1">Datos de la empresa</p>
                    <p className="text-zinc-400 text-sm">Informacion basica para crear la cuenta</p>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold block mb-1.5">Nombre empresa *</label>
                    <input value={onbNombre} onChange={e => setOnbNombre(e.target.value)}
                      placeholder="MiTienda"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold block mb-1.5">Numero WhatsApp *</label>
                    <PhoneInput value={onbNumero} onChange={setOnbNumero} onValidChange={setOnbNumeroValido} checkWhatsapp />
                  </div>
                </div>
              )}
              {!onbLoading && !onbResult && wizardPaso === 3 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-white font-semibold mb-1">Selecciona el plan</p>
                    <p className="text-zinc-400 text-sm">Define los limites y funcionalidades</p>
                  </div>
                  <div className="space-y-2">
                    {PLANES.map(p => (
                      <button key={p.id} onClick={() => setOnbPlan(p.id)}
                        className={"w-full p-4 rounded-xl border-2 text-left transition-all " + (onbPlan === p.id ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-800")}>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold text-sm">{p.label}</span>
                          {onbPlan === p.id && <span className="text-emerald-400 text-xs">Seleccionado</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(onbLoading || onbResult) && (
                <div className="space-y-2">
                  {onbResult?.done && <p className="text-white font-semibold mb-3">Empresa creada</p>}
                  {PASOS.map((paso, i) => (
                    <div key={paso.id} className="flex items-center gap-3">
                      <div className={"w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 " + (pasos[i] === 'ok' ? "bg-emerald-500 text-black" : pasos[i] === 'cargando' ? "bg-amber-400 text-black animate-pulse" : pasos[i] === 'error' ? "bg-red-500 text-white" : "bg-zinc-700 text-zinc-400")}>
                        {pasos[i] === 'ok' ? '✓' : pasos[i] === 'error' ? '✗' : i + 1}
                      </div>
                      <span className={"text-sm " + (pasos[i] === 'ok' ? "text-white" : "text-zinc-400")}>{paso.label}</span>
                    </div>
                  ))}
                  {onbResult?.done && (
                    <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <div className="text-zinc-300 text-xs space-y-1">
                        <div>Email: <span className="font-mono text-white">{onbResult.email}</span></div>
                        <div>Password: <span className="font-mono text-white">{onbResult.password}</span></div>
                      </div>
                    </div>
                  )}
                  {onbResult && !onbResult.done && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 text-xs font-semibold mb-1">Error al crear empresa</p>
                      <p className="text-red-300 text-xs font-mono break-all">{onbResult.error || 'Error desconocido'}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-6">
                <button onClick={() => {
                  if (onbResult) { setModalOnb(false); setOnbNombre(''); setOnbNumero(''); setOnbPlan('basico'); setOnbTipo('productos'); setWizardPaso(1); setPasos(PASOS.map(() => 'pendiente')); setOnbResult(null); setOnbLoading(false) }
                  else if (wizardPaso > 1 && !onbLoading) setWizardPaso(p => p - 1)
                  else if (!onbLoading) { setModalOnb(false); setWizardPaso(1) }
                }} className="flex-1 bg-zinc-800 text-white text-sm py-3 rounded-xl">
                  {onbResult ? 'Cerrar' : wizardPaso > 1 ? 'Atras' : 'Cancelar'}
                </button>
                {!onbLoading && !onbResult && wizardPaso < 3 && (
                  <button onClick={() => setWizardPaso(p => p + 1)}
                    disabled={wizardPaso === 2 && (!onbNombre || !onbNumero || !onbNumeroValido)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-sm py-3 rounded-xl">
                    Siguiente
                  </button>
                )}
                {!onbLoading && !onbResult && wizardPaso === 3 && (
                  <button onClick={onboarding}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm py-3 rounded-xl">
                    Crear empresa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

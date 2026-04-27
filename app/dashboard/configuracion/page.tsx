'use client'
import { fetchApi, errorMsg } from '@/lib/fetchApi'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import PhoneInput from '@/components/PhoneInput'

type ServiceStatus = { name: string; ok: boolean; ms: number; error?: string | null; detail?: string | null }

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const isAdmin = user?.role === 'admin'

  const [guardando, setGuardando] = useState<string|null>(null)
  const [ok, setOk] = useState<string|null>(null)
  const [cuenta, setCuenta] = useState({ nombre: '', passwordActual: '', passwordNuevo: '' })
  const [empresa, setEmpresa] = useState({ nit: '', direccion: '', telefono: '', condiciones: '', iva: 0, fleteBase: 0 })
  const [logo, setLogo] = useState<string | null>(null)
  const [showPassActual, setShowPassActual] = useState(false)
  const [showPassNuevo, setShowPassNuevo] = useState(false)
  const [apis, setApis] = useState({ openai: '', anthropic: '', evolution: '' })
  const [estado, setEstado] = useState<ServiceStatus[]>([])
  const [checando, setChecando] = useState(false)
  const [ultimoCheck, setUltimoCheck] = useState<string|null>(null)
  const [instruccionesGlobales, setInstruccionesGlobales] = useState('')

  // Soporte chat

  useEffect(() => {
    if (user?.name) setCuenta(c => ({ ...c, nombre: user.name || '' }))
    if (isAdmin) { fetchApis(); fetchInstruccionesGlobales() }
    if (user) cargarEmpresa()
  }, [user])

  async function fetchApis() {
    const res = await fetchApi('/api/configuracion/apis')
    if (res.ok) setApis(await res.json())
  }

  async function fetchInstruccionesGlobales() {
    const res = await fetchApi('/api/configuracion/global')
    if (res.ok) {
      const data = await res.json()
      setInstruccionesGlobales(data.instruccionesGlobales || '')
    }
  }

  async function guardarInstruccionesGlobales() {
    setGuardando('instrucciones')
    await fetchApi('/api/configuracion/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruccionesGlobales }),
    })
    setOk('instrucciones')
    setTimeout(() => setOk(null), 3000)
    setGuardando(null)
  }

  async function cargarEmpresa() {
    fetch('/api/empresa-config').then(r => r.json()).then(d => {
      if (d.nit) setEmpresa({ nit: d.nit||'', direccion: d.direccion||'', telefono: d.telefono||'', condiciones: d.condiciones||'', iva: d.iva||0, fleteBase: d.fleteBase||0 })
      if (d.logo) setLogo(d.logo)
    })
  }

  async function guardarEmpresa() {
    setGuardando('empresa')
    await fetchApi('/api/empresa-config', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(empresa) })
    setOk('empresa'); setTimeout(() => setOk(null), 3000)
    setGuardando(null)
  }

  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    const res = await fetchApi('/api/empresa-config/logo', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.logo) setLogo(data.logo)
  }

  async function guardarCuenta2() {
    setGuardando('cuenta')
    const res = await fetchApi('/api/configuracion/cuenta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuenta)
    })
    setGuardando(null)
    if (res.ok) { setOk('cuenta'); setTimeout(() => setOk(null), 3000) }
  }

  async function guardarApis() {
    setGuardando('apis')
    const res = await fetchApi('/api/configuracion/apis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apis)
    })
    setGuardando(null)
    if (res.ok) { setOk('apis'); setTimeout(() => setOk(null), 3000) }
  }


  async function checkEstado() {
    setChecando(true)
    setEstado([])
    const res = await fetchApi('/api/configuracion/estado')
    if (res.ok) {
      const data = await res.json()
      setEstado(data.results)
      setUltimoCheck(new Date(data.timestamp).toLocaleTimeString('es-CO'))
    }
    setChecando(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Ajustes de tu cuenta y plataforma</p>
      </div>

      {/* Datos de empresa */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">🏢 Datos de empresa (proforma)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">NIT</label>
            <input value={empresa.nit} onChange={e => setEmpresa({...empresa, nit: e.target.value})}
              placeholder="Ej: 900123456-1"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Teléfono</label>
            <PhoneInput value={empresa.telefono} onChange={v => setEmpresa({...empresa, telefono: v})} />
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Dirección</label>
          <input value={empresa.direccion} onChange={e => setEmpresa({...empresa, direccion: e.target.value})}
            placeholder="Ej: Calle 45 #23-10, Medellín"
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">IVA (%)</label>
            <input type="number" value={empresa.iva || ""} onChange={e => setEmpresa({...empresa, iva: Number(e.target.value)})}
              placeholder="0"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Flete base ($)</label>
            <input type="number" value={empresa.fleteBase || ""} onChange={e => setEmpresa({...empresa, fleteBase: Number(e.target.value)})}
              placeholder="0"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Logo</label>
            <input type="file" accept="image/*" onChange={subirLogo}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl file:mr-2 file:bg-zinc-700 file:text-white file:border-0 file:rounded-lg file:text-xs" />
            {logo && <img src={logo} className="mt-2 h-10 object-contain rounded" />}
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Condiciones de pago / validez</label>
          <textarea value={empresa.condiciones} onChange={e => setEmpresa({...empresa, condiciones: e.target.value})}
            placeholder="Ej: Válido por 30 días. Pago contra entrega."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none" />
        </div>
        <div className="flex items-center gap-3">
          {ok === 'empresa' && <span className="text-emerald-400 text-xs">✓ Guardado</span>}
          <button onClick={guardarEmpresa} disabled={guardando === 'empresa'}
            className="ml-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {guardando === 'empresa' ? 'Guardando...' : '💾 Guardar datos empresa'}
          </button>
        </div>
      </div>

      {/* Mi cuenta */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold">👤 Mi cuenta</h2>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Nombre</label>
          <input value={cuenta.nombre} onChange={e => setCuenta({...cuenta, nombre: e.target.value})}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Contraseña actual</label>
          <div className="relative">
            <input type={showPassActual ? 'text' : 'password'} value={cuenta.passwordActual} onChange={e => setCuenta({...cuenta, passwordActual: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-9 text-white text-sm focus:outline-none focus:border-emerald-500" />
            <button type="button" tabIndex={-1} onClick={() => setShowPassActual(p => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              {showPassActual
                ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Nueva contraseña</label>
          <div className="relative">
            <input type={showPassNuevo ? 'text' : 'password'} value={cuenta.passwordNuevo} onChange={e => setCuenta({...cuenta, passwordNuevo: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-9 text-white text-sm focus:outline-none focus:border-emerald-500" />
            <button type="button" tabIndex={-1} onClick={() => setShowPassNuevo(p => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              {showPassNuevo
                ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {ok === 'cuenta' && <span className="text-emerald-400 text-xs">✓ Guardado</span>}
          <div className="ml-auto">
            <button onClick={guardarCuenta2} disabled={guardando === 'cuenta'}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg">
              {guardando === 'cuenta' ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Instrucciones globales — solo admin */}
      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-white font-semibold">🧠 Instrucciones globales de agentes</h2>
            <p className="text-zinc-500 text-xs mt-1">Se aplican a todos los agentes antes de su personalidad individual</p>
          </div>
          <textarea
            value={instruccionesGlobales}
            onChange={e => setInstruccionesGlobales(e.target.value)}
            rows={7}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
            placeholder="Ej: Nunca menciones limitaciones técnicas..." />
          <div className="flex items-center justify-between">
            {ok === 'instrucciones' && <span className="text-emerald-400 text-xs">✓ Guardado</span>}
            <div className="ml-auto">
              <button onClick={guardarInstruccionesGlobales} disabled={guardando === 'instrucciones'}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg">
                {guardando === 'instrucciones' ? 'Guardando...' : '💾 Guardar instrucciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APIs — solo admin */}
      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">🔑 APIs & Integraciones</h2>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">OpenAI API Key</label>
            <input value={apis.openai} onChange={e => setApis({...apis, openai: e.target.value})}
              placeholder="sk-proj-..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Anthropic API Key</label>
            <input value={apis.anthropic} onChange={e => setApis({...apis, anthropic: e.target.value})}
              placeholder="sk-ant-..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Evolution API Key</label>
            <input value={apis.evolution} onChange={e => setApis({...apis, evolution: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-emerald-500" />
          </div>
          <p className="text-zinc-600 text-xs">⚠️ Los cambios en APIs requieren reiniciar el servidor para aplicarse.</p>
          <div className="flex items-center justify-between">
            {ok === 'apis' && <span className="text-emerald-400 text-xs">✓ Guardado</span>}
            <div className="ml-auto">
              <button onClick={guardarApis} disabled={guardando === 'apis'}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg">
                {guardando === 'apis' ? 'Guardando...' : '💾 Guardar APIs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado del sistema — solo admin */}
      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">🖥️ Estado del sistema</h2>
            {ultimoCheck && <span className="text-zinc-500 text-xs">Último check: {ultimoCheck}</span>}
          </div>

          {estado.length > 0 && (
            <div className="space-y-2">
              {estado.map(s => (
                <div key={s.name} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className="text-white text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.error && <span className="text-red-400 text-xs max-w-xs truncate" title={s.error}>⚠ {s.error}</span>}{!s.error && s.detail && <span className="text-zinc-400 text-xs">{s.detail}</span>}
                    <span className="text-zinc-500 text-xs">{s.ms}ms</span>
                    <span className={`text-xs font-semibold ${s.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.ok ? '✓ OK' : '✗ Error'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={checkEstado} disabled={checando}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {checando ? (
              <>
                <span className="animate-spin">⟳</span> Verificando servicios...
              </>
            ) : (
              <>🔍 Verificar todos los servicios</>
            )}
          </button>
        </div>
      )}


      {/* Cerrar sesión */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-3">🚪 Sesión</h2>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm px-5 py-2 rounded-lg">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

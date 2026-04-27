'use client'
import { fetchApi } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLAN_BOTS, PLAN_ORDEN, PLAN_LABELS, calcularUpgrade } from '@/lib/planes'

interface Props {
  rol: 'admin' | 'empresa'
}

export default function AgentesLista({ rol }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [agentes, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('basico')
  const [empresaId, setEmpresaId] = useState<string>('')
  const [precios, setPrecios] = useState<any[]>([])
  const [upgradeModal, setUpgradeModal] = useState(false)
  const [creandoSlot, setCreandoSlot] = useState<number | null>(null)
  const [qrModal, setQrModal] = useState<{botId: string, base64: string | null, conectado: boolean, loading: boolean, numero?: string, perfil?: string} | null>(null)
  const qrInterval = useRef<any>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/agentes')
      .then(r => r.json())
      .then(data => {
        setBots(Array.isArray(data) ? data : [])
        if (data[0]?.owner?.plan) setPlan(data[0].owner.plan)
        if (data[0]?.owner?.id)   setEmpresaId(data[0].owner.id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetch('/api/precios/publico')
      .then(r => r.json())
      .then(d => setPrecios(d.funcionalidades ?? []))
      .catch(() => {})
  }, [user])

  const maxBots = PLAN_BOTS[plan] || 1
  const slots = [1, 2, 3].slice(0, 3)
  const wizardBase = rol === 'admin' ? '/dashboard/bots' : '/dashboard/agentes'
  const planesUpgrade = PLAN_ORDEN.filter(p => PLAN_ORDEN.indexOf(p) > PLAN_ORDEN.indexOf(plan))

  async function abrirQR(agente: any) {
    setQrModal({ botId: agente.id, base64: null, conectado: false, loading: true })
    const poll = async () => {
      const data = await fetchApi(`/api/agentes/${agente.id}/qr`)
      if (data?.conectado) {
        setQrModal({ botId: agente.id, base64: null, conectado: true, loading: false, numero: data.numero, perfil: data.perfil })
        clearInterval(qrInterval.current)
        setBots(prev => prev.map(b => b.id === agente.id ? {...b, activo: true, numero: data.numero, perfil: data.perfil} : b))
      } else {
        setQrModal({ botId: agente.id, base64: data?.base64 ?? null, conectado: false, loading: false })
      }
    }
    await poll()
    qrInterval.current = setInterval(poll, 5000)
  }

  async function cambiarNumero(botId: string) {
    if (!confirm('¿Seguro? Esto desconectará el WhatsApp actual y deberás escanear un QR nuevo.')) return
    await fetchApi(`/api/agentes/${botId}/qr`, { method: 'DELETE' })
    await fetchApi(`/api/agentes/${botId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: null, perfil: null, configurado: false })
    })
    setBots(prev => prev.map(b => b.id === botId ? { ...b, numero: null, perfil: null, configurado: false } : b))
    const agente = agentes.find(b => b.id === botId)
    if (agente) abrirQR({ ...agente, numero: null })
  }

  function cerrarQR() {
    clearInterval(qrInterval.current)
    setQrModal(null)
  }

  async function toggleActivo(agente: any) {
    await fetchApi(`/api/agentes/${agente.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !agente.activo }),
    })
    setBots(prev => prev.map(b => b.id === agente.id ? { ...b, activo: !b.activo } : b))
  }

  async function crearBot(slot: number) {
    setCreandoSlot(slot)
    try {
      const res = await fetch('/api/bots/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el agente')
      router.push(`${wizardBase}/${data.id}`)
    } catch (err: any) {
      alert(err.message)
      setCreandoSlot(null)
    }
  }

  function irAUpgrade(planNuevo: string) {
    const diferencia = calcularUpgrade(plan, planNuevo, precios)
    const params = new URLSearchParams({
      producto:   'CRM',
      plan:       planNuevo,
      monto:      String(diferencia),
      upgrade:    'true',
      empresaId:  empresaId,
      planActual: plan,
    })
    window.open(`https://master.tuagentx.com/checkout?${params.toString()}`, '_blank', 'noopener,noreferrer')
    setUpgradeModal(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mis Agentes</h1>
        <p className="text-zinc-400 mt-1">Configura y gestiona tus agentes de WhatsApp</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slots.map(slot => {
            const agente = agentes.find(b => b.slot === slot)
            const bloqueado = slot > maxBots

            return (
              <div key={slot} className={`bg-zinc-900 border rounded-2xl p-6 flex flex-col gap-4 ${
                bloqueado ? 'border-zinc-800 opacity-50' : 'border-zinc-700'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      bloqueado ? 'bg-zinc-800' :
                      agente?.configurado ? 'bg-emerald-500/10 border border-emerald-500/20' :
                      'bg-zinc-800'
                    }`}>
                      {bloqueado ? '🔒' : agente?.configurado ? '🤖' : '⚙️'}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {bloqueado ? `Agente ${slot}` : agente?.name || `Agente ${slot}`}
                      </div>
                      <div className="text-zinc-500 text-xs font-mono">
                        {bloqueado ? 'No disponible en tu plan' : agente?.numero ? `+${agente.numero}` : agente?.instance || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle activo */}
                  {!bloqueado && agente?.configurado && (
                    <button onClick={() => toggleActivo(agente)}
                      className={`w-10 h-6 rounded-full transition-all relative ${agente.activo ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${agente.activo ? 'left-5' : 'left-1'}`} />
                    </button>
                  )}
                </div>

                {/* Estado */}
                {!bloqueado && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`text-xs px-3 py-1.5 rounded-lg font-medium w-fit ${
                      agente?.configurado && agente?.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      agente?.configurado && !agente?.activo ? 'bg-zinc-800 text-zinc-400' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {agente?.configurado && agente?.activo ? '● Activo' :
                       agente?.configurado && !agente?.activo ? '○ Pausado' :
                       '⚠ Sin configurar'}
                    </div>
                    {agente?.numero && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
                        WhatsApp conectado
                      </div>
                    )}
                  </div>
                )}

                {/* Botón */}
                {bloqueado ? (
                  <button onClick={() => setUpgradeModal(true)}
                    className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-violet-400 border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-colors">
                    ⬆️ Mejorar plan para desbloquear
                  </button>
                ) : agente ? (
                  <Link href={`${wizardBase}/${agente.id}`}
                    className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      agente.configurado
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    }`}>
                    {agente.configurado ? 'Editar configuración' : 'Configurar agente'}
                  </Link>
                ) : (
                  <button onClick={() => crearBot(slot)} disabled={creandoSlot === slot}
                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                    {creandoSlot === slot ? 'Creando...' : 'Configurar agente'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal QR */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-lg">Conectar WhatsApp</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Escanea el código con tu teléfono</p>
              </div>
              <button onClick={cerrarQR} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            {qrModal.conectado ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-emerald-400 font-semibold text-lg">¡WhatsApp Conectado!</div>
                {qrModal.numero && <div className="text-white font-mono text-sm mt-1">+{qrModal.numero}</div>}
                {qrModal.perfil && <div className="text-zinc-400 text-xs mt-0.5">{qrModal.perfil}</div>}
                <div className="text-zinc-500 text-sm mt-2">Tu agente está listo para recibir mensajes</div>
                <div className="flex gap-2 mt-5 justify-center">
                  <button onClick={cerrarQR} className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Cerrar
                  </button>
                  {rol === 'admin' && (
                    <button onClick={() => cambiarNumero(qrModal.botId)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                      🔄 Cambiar número
                    </button>
                  )}
                </div>
              </div>
            ) : qrModal.loading ? (
              <div className="text-center py-8">
                <div className="text-zinc-500 text-sm animate-pulse">Generando código QR...</div>
              </div>
            ) : qrModal.base64 ? (
              <div className="text-center">
                <div className="bg-white p-3 rounded-xl inline-block mb-4">
                  <img src={qrModal.base64} alt="QR WhatsApp" className="w-56 h-56" />
                </div>
                <p className="text-zinc-400 text-xs">El código se actualiza automáticamente cada 5 segundos</p>
                <p className="text-zinc-500 text-xs mt-1">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
              </div>
            ) : (
              <div className="text-center py-8 text-red-400 text-sm">No se pudo obtener el código QR</div>
            )}
          </div>
        </div>
      )}

      {/* Modal upgrade de plan */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-lg">Mejorar plan</h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Plan actual: <span className="text-white font-medium">{PLAN_LABELS[plan] || plan}</span> · {maxBots} agente{maxBots > 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setUpgradeModal(false)} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            {planesUpgrade.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-sm">
                Ya tienes el plan máximo (Business)
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {planesUpgrade.map(planNuevo => {
                  const diferencia = calcularUpgrade(plan, planNuevo, precios)
                  const botsNuevos = PLAN_BOTS[planNuevo]
                  return (
                    <div key={planNuevo} className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-white font-semibold text-sm">{PLAN_LABELS[planNuevo]}</div>
                          <div className="text-zinc-400 text-xs mt-0.5">{botsNuevos} agente{botsNuevos > 1 ? 's' : ''} incluidos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-violet-400 font-bold text-sm">
                            +${diferencia.toLocaleString('es-CO')}
                          </div>
                          <div className="text-zinc-500 text-xs">diferencia/mes</div>
                        </div>
                      </div>
                      <button onClick={() => irAUpgrade(planNuevo)}
                        className="w-full py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                        Pagar diferencia ${diferencia.toLocaleString('es-CO')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-zinc-600 text-xs text-center mt-4">
              El cambio se aplica automáticamente al confirmar el pago
            </p>
          </div>
        </div>
      )}

      {/* Info plan */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-sm">Plan actual</div>
            <div className="text-zinc-400 text-xs mt-0.5">{maxBots} agente{maxBots > 1 ? 's' : ''} · {agentes.length}/{maxBots} configurado{agentes.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
              plan === 'business' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              plan === 'pro'      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              'bg-zinc-800 text-zinc-300'
            }`}>
              {PLAN_LABELS[plan] || plan}
            </span>
            {plan !== 'business' && (
              <button onClick={() => setUpgradeModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                ⬆️ Mejorar plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

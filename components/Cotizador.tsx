'use client'
import { useEffect, useState } from 'react'

const PLANES = [
  { id: 'basico',   label: 'Básico',   bots: 1, desc: '1 agente WhatsApp' },
  { id: 'pro',      label: 'Pro',      bots: 2, desc: '2 agentes WhatsApp', popular: true },
  { id: 'business', label: 'Business', bots: 3, desc: '3 agentes WhatsApp' },
]

const FUNC_ICON: Record<string, string> = {
  agente:        '🤖',
  posventa:      '📦',
  publicaciones: '📅',
}

const WA_NUMBER = '573164349389'

export default function CotizadorCRM() {
  const [funcionalidades, setFuncionalidades] = useState<any[]>([])
  const [planSel, setPlanSel]                 = useState('pro')
  const [activos, setActivos]                 = useState<Record<string, boolean>>({})
  const [loading, setLoading]                 = useState(true)
  const [mostrarResumen, setMostrarResumen]   = useState(false)
  const [loadingPago, setLoadingPago]         = useState(false)
  const [errorPago, setErrorPago]             = useState('')

  useEffect(() => {
    fetch('/api/precios/publico')
      .then(r => r.json())
      .then(data => {
        const funcs = data.funcionalidades ?? []
        setFuncionalidades(funcs)
        const init: Record<string, boolean> = {}
        for (const f of funcs) init[f.codigo] = true
        setActivos(init)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const planActual   = PLANES.find(p => p.id === planSel)!
  const total        = funcionalidades.filter(f => activos[f.codigo]).reduce((s, f) => s + f.precio, 0) * planActual.bots
  const activosCount = Object.values(activos).filter(Boolean).length
  const modulosActivos = funcionalidades.filter(f => activos[f.codigo])

  function toggleFun(codigo: string) {
    setActivos(prev => ({ ...prev, [codigo]: !prev[codigo] }))
  }

  function handlePagarWompi() {
    const params = new URLSearchParams({ producto: 'crm', plan: planSel, monto: String(total) })
    window.location.href = `https://master.tuagentx.com/checkout?${params.toString()}`
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `Hola! Me interesa el CRM TuAgentX.\n` +
      `Plan: ${planActual.label} (${planActual.bots} agente${planActual.bots !== 1 ? 's' : ''})\n` +
      `Módulos: ${modulosActivos.map(f => f.nombre).join(', ')}\n` +
      `Total estimado: $${total.toLocaleString('es-CO')}/mes`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ background: 'rgba(0,0,0,.25)', padding: '72px 24px', borderTop: '1px solid rgba(16,185,129,.1)' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#10b981', marginBottom: 6 }}>🧮 COTIZADOR</div>
          <div style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800 }}>Arma tu plan<br /><span style={{ color: '#10b981' }}>sin sorpresas</span></div>
          <p style={{ color: '#9ca3af', fontSize: '.9rem', lineHeight: 1.6, marginTop: 10 }}>Elige cuántos agentes necesitas y qué módulos activar.</p>
        </div>

        {/* Selector de plan */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {PLANES.map(p => (
            <button key={p.id} onClick={() => setPlanSel(p.id)}
              style={{ position: 'relative', background: planSel === p.id ? 'rgba(16,185,129,.1)' : 'rgba(255,255,255,.025)', border: planSel === p.id ? '2px solid rgba(16,185,129,.5)' : '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px 10px', cursor: 'pointer', color: '#fff', transition: 'all .15s', textAlign: 'center' }}>
              {p.popular && (
                <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#000', fontSize: '.58rem', fontWeight: 700, padding: '2px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>Popular</div>
              )}
              <div style={{ fontSize: p.bots === 3 ? '1rem' : p.bots === 2 ? '1.1rem' : '1.3rem', marginBottom: 6 }}>{'🤖'.repeat(p.bots)}</div>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{p.label}</div>
              <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Funcionalidades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Cargando módulos...</div>
          ) : funcionalidades.map(f => (
            <div key={f.codigo} onClick={() => toggleFun(f.codigo)}
              style={{ background: activos[f.codigo] ? 'rgba(16,185,129,.04)' : 'rgba(255,255,255,.02)', border: activos[f.codigo] ? '1px solid rgba(16,185,129,.3)' : '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all .15s' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{FUNC_ICON[f.codigo] ?? '⚙️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{f.nombre}</div>
                {f.descripcion && <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 2 }}>{f.descripcion}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '.85rem', fontWeight: 700, color: activos[f.codigo] ? '#10b981' : '#4b5563' }}>
                  ${f.precio.toLocaleString('es-CO')}
                  <span style={{ fontSize: '.65rem', fontWeight: 400, color: '#6b7280' }}>/mes</span>
                </div>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: activos[f.codigo] ? '2px solid #10b981' : '2px solid #374151', background: activos[f.codigo] ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                {activos[f.codigo] && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5l3 3 6-7" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '.72rem', color: '#10b981', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>TOTAL / MES</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{loading ? '...' : `$${total.toLocaleString('es-CO')}`}</div>
            <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 2 }}>
              {planActual.bots} agente{planActual.bots !== 1 ? 's' : ''} · {activosCount} módulo{activosCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ fontSize: '2.5rem' }}>🤖</div>
        </div>

        <button onClick={() => setMostrarResumen(true)} disabled={loading || total <= 0}
          style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 10, background: '#10b981', color: '#000', fontWeight: 700, fontSize: '1rem', textAlign: 'center', border: 'none', cursor: loading || total <= 0 ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(16,185,129,.3)', boxSizing: 'border-box', opacity: loading || total <= 0 ? 0.6 : 1 }}>
          🚀 Quiero empezar →
        </button>
        <p style={{ textAlign: 'center', fontSize: '.72rem', color: '#6b7280', marginTop: 12 }}>Sin contrato · Cancela cuando quieras · Prueba 7 días gratis</p>
      </div>

      {/* Modal de resumen */}
      {mostrarResumen && (
        <div onClick={() => setMostrarResumen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#111827', border: '1px solid rgba(16,185,129,.25)', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>📋 Resumen de tu plan</div>

            {/* Plan */}
            <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: '.72rem', color: '#10b981', fontWeight: 700, marginBottom: 4 }}>PLAN</div>
              <div style={{ fontSize: '.95rem', fontWeight: 700 }}>{planActual.label} — {planActual.desc}</div>
            </div>

            {/* Módulos */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: '.72rem', color: '#9ca3af', fontWeight: 700, marginBottom: 8 }}>MÓDULOS ACTIVOS</div>
              {modulosActivos.length === 0 ? (
                <div style={{ fontSize: '.85rem', color: '#6b7280' }}>Ningún módulo seleccionado</div>
              ) : modulosActivos.map(f => (
                <div key={f.codigo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}>
                  <span>{FUNC_ICON[f.codigo] ?? '⚙️'} {f.nombre}</span>
                  <span style={{ color: '#10b981' }}>${(f.precio * planActual.bots).toLocaleString('es-CO')}/mes</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.07)', marginBottom: 20 }}>
              <span style={{ fontWeight: 700 }}>Total mensual</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>${total.toLocaleString('es-CO')}</span>
            </div>

            {errorPago && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '.82rem', color: '#fca5a5' }}>
                {errorPago}
              </div>
            )}

            {/* Botones */}
            <button onClick={handlePagarWompi} disabled={loadingPago}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 10, background: '#10b981', color: '#000', fontWeight: 700, fontSize: '.95rem', border: 'none', cursor: loadingPago ? 'wait' : 'pointer', marginBottom: 10, opacity: loadingPago ? 0.7 : 1 }}>
              {loadingPago ? 'Generando link...' : '💳 Pagar ahora con Wompi'}
            </button>

            <button onClick={handleWhatsApp}
              style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 10, background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 600, fontSize: '.95rem', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', marginBottom: 10 }}>
              💬 Contactar por WhatsApp
            </button>

            <button onClick={() => { setMostrarResumen(false); setErrorPago('') }}
              style={{ display: 'block', width: '100%', padding: '10px', borderRadius: 10, background: 'transparent', color: '#6b7280', fontSize: '.82rem', border: 'none', cursor: 'pointer' }}>
              Volver al cotizador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'

export default function DemoPublica() {
  const [step, setStep] = useState<'upload'|'form'|'enviado'>('upload')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nombre:'', negocio:'', producto:'', precio:'', descripcion:'' })
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMsg('Analizando tu producto...')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/demo/analizar', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok && data.data) {
        const d = data.data
        setForm(f => ({
          ...f,
          producto: d.producto || f.producto,
          precio: d.precio || f.precio,
          descripcion: [d.marca, d.talla, d.descripcion].filter(Boolean).join(' - ')
        }))
        setMsg('Info extraida. Completa los datos restantes.')
      } else {
        setMsg('No se pudo extraer info. Llena los campos manualmente.')
      }
    } catch { setMsg('Error al analizar. Continua manualmente.') }
    setLoading(false)
    setStep('form')
  }

  async function enviar() {
    if (!form.nombre || !form.negocio || !form.producto) {
      setMsg('Completa los campos obligatorios.'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.ok && data.waUrl) {
        setStep('enviado')
        window.open(data.waUrl, '_blank')
      } else { setMsg('Error. Intenta de nuevo.') }
    } catch { setMsg('Error de conexion.') }
    setLoading(false)
  }

  const inp = (id: keyof typeof form, ph: string, type = 'text') => (
    <input
      type={type}
      value={form[id]}
      onChange={e => setForm(f => ({...f, [id]: e.target.value}))}
      placeholder={ph}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
    />
  )

  return (
    <div style={{minHeight:'100vh',background:'#09090b',display:'flex',alignItems:'center',padding:'48px 16px'}}>
      <div style={{width:'100%',maxWidth:'440px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'1.5rem',fontWeight:'800',color:'white',marginBottom:'4px'}}>
            TuAgent<span style={{color:'#10b981'}}>X</span>
          </div>
          <p style={{color:'#71717a',fontSize:'0.875rem'}}>Prueba tu bot en 30 segundos</p>
        </div>

        <div style={{background:'#18181b',border:'1px solid #27272a',borderRadius:'16px',padding:'24px'}}>

          {step === 'upload' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'3rem',marginBottom:'12px'}}>📎</div>
              <h2 style={{color:'white',fontWeight:'700',fontSize:'1.1rem',marginBottom:'8px'}}>Sube una foto o PDF de tu producto</h2>
              <p style={{color:'#71717a',fontSize:'0.85rem',marginBottom:'24px'}}>La IA extrae el nombre, precio y descripcion automaticamente</p>
              <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{display:'none'}} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                style={{width:'100%',background:'#10b981',color:'black',fontWeight:'700',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'0.95rem',marginBottom:'12px'}}>
                {loading ? 'Analizando...' : 'Seleccionar archivo'}
              </button>
              <button onClick={() => setStep('form')} style={{width:'100%',background:'transparent',color:'#71717a',border:'none',cursor:'pointer',fontSize:'0.85rem',padding:'8px'}}>
                Llenar manualmente
              </button>
              {msg && <p style={{color:'#71717a',fontSize:'0.82rem',marginTop:'12px'}}>{msg}</p>}
            </div>
          )}

          {step === 'form' && (
            <div>
              <h2 style={{color:'white',fontWeight:'700',fontSize:'1.1rem',marginBottom:'16px'}}>Completa tu informacion</h2>
              {msg && <div style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'10px',padding:'10px 14px',color:'#10b981',fontSize:'0.82rem',marginBottom:'12px'}}>{msg}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                <div>
                  <label style={{color:'#71717a',fontSize:'0.72rem',fontWeight:'600',display:'block',marginBottom:'4px'}}>Nombre *</label>
                  {inp('nombre','Maria Lopez')}
                </div>
                <div>
                  <label style={{color:'#71717a',fontSize:'0.72rem',fontWeight:'600',display:'block',marginBottom:'4px'}}>Negocio *</label>
                  {inp('negocio','Mi Tienda')}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'10px',marginBottom:'10px'}}>
                <div>
                  <label style={{color:'#71717a',fontSize:'0.72rem',fontWeight:'600',display:'block',marginBottom:'4px'}}>Producto *</label>
                  {inp('producto','Vestido Midi')}
                </div>
                <div>
                  <label style={{color:'#71717a',fontSize:'0.72rem',fontWeight:'600',display:'block',marginBottom:'4px'}}>Precio</label>
                  {inp('precio','120000')}
                </div>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{color:'#71717a',fontSize:'0.72rem',fontWeight:'600',display:'block',marginBottom:'4px'}}>Descripcion</label>
                {inp('descripcion','Tela satinada, negro y beige')}
              </div>
              <button onClick={enviar} disabled={loading}
                style={{width:'100%',background:'#10b981',color:'black',fontWeight:'700',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'0.95rem',opacity:loading?0.6:1}}>
                {loading ? 'Enviando...' : 'Probar mi bot ahora'}
              </button>
              <button onClick={() => setStep('upload')} style={{width:'100%',background:'transparent',color:'#52525b',border:'none',cursor:'pointer',fontSize:'0.78rem',padding:'8px',marginTop:'4px'}}>
                Volver
              </button>
            </div>
          )}

          {step === 'enviado' && (
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <div style={{fontSize:'3.5rem',marginBottom:'16px'}}>🎉</div>
              <h2 style={{color:'white',fontWeight:'700',fontSize:'1.2rem',marginBottom:'8px'}}>Listo!</h2>
              <p style={{color:'#71717a',fontSize:'0.88rem',marginBottom:'24px'}}>Se abrio WhatsApp con tu producto. Escribe al bot y pruebalo.</p>
              <button onClick={() => { setStep('upload'); setForm({nombre:'',negocio:'',producto:'',precio:'',descripcion:''}); setMsg('') }}
                style={{color:'#10b981',background:'transparent',border:'none',cursor:'pointer',fontSize:'0.88rem'}}>
                Hacer otra prueba
              </button>
            </div>
          )}

        </div>
        <p style={{textAlign:'center',color:'#3f3f46',fontSize:'0.72rem',marginTop:'16px'}}>2026 TuAgentX</p>
      </div>
    </div>
  )
}

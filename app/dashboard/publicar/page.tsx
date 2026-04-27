'use client'
import { fetchApi } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'

export default function PublicarPage() {
  const { data: session } = useSession()
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [agentes, setAgentes] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [paso, setPaso] = useState(1)
  const [imagenes, setImagenes] = useState<any[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [activando, setActivando] = useState(false)
  const [form, setForm] = useState({ frecuencia: '24h', horaEnvio: '08:00', fechaInicio: '', publicarAhora: false, repetir: true, frecuenciaCustom: '', canales: ['whatsapp'], agentes: [] as string[] })
  const fileRef = useRef<any>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [pubRes, agRes] = await Promise.all([
        fetch('/api/publicaciones'),
        fetch('/api/agentes')
      ])
      const pubs = await pubRes.json()
      const ags = await agRes.json()
      setPublicaciones(Array.isArray(pubs) ? pubs : [])
      setAgentes(Array.isArray(ags) ? ags : [])
    } catch(e) { console.log('Error loadData publicar:', e) }
  }

  async function subirImagen(file: File) {
    const fd = new FormData()
    fd.append('imagen', file)
    const data = await fetchApi('/api/publicaciones/upload', { method: 'POST', body: fd })
    return data
  }

  async function onFilesChange(e: any) {
    const files = Array.from(e.target.files) as File[]
    if (!files.length) return
    setSubiendo(true)
    const results: any[] = []
    for (const file of files) {
      const data = await subirImagen(file)
      if (data.ok) results.push({ imgUrl: data.imgUrl, imgPath: data.imgPath, caption: data.caption, preview: URL.createObjectURL(file) })
    }
    setImagenes(prev => [...prev, ...results])
    setSubiendo(false)
  }

  function calcularFechas() {
    const fechas: Date[] = []
    if (form.publicarAhora) {
      imagenes.forEach((_, i) => {
        const horas = form.repetir ? (form.frecuencia === 'custom' ? Number(form.frecuenciaCustom) || 24 : Number(form.frecuencia.replace('h',''))) : 24
        fechas.push(new Date(Date.now() + 30000 + i * horas * 3600000))
      })
      return fechas
    }
    const [h, m] = form.horaEnvio.split(':').map(Number)
    let base = form.fechaInicio ? new Date(form.fechaInicio) : new Date()
    base.setHours(h, m, 0, 0)
    const horas = form.repetir ? (form.frecuencia === 'custom' ? Number(form.frecuenciaCustom) || 24 : Number(form.frecuencia.replace('h',''))) : 24
    if (base < new Date()) base = new Date(base.getTime() + horas * 3600000)
    imagenes.forEach((_, i) => {
      fechas.push(new Date(base.getTime() + i * horas * 3600000))
    })
    return fechas
  }

  async function activar() {
    if (activando) return
    setActivando(true)
    const fechas = calcularFechas()
    const frecuencia = form.repetir
      ? (form.frecuencia === 'custom' ? (form.frecuenciaCustom || '24') + 'h' : form.frecuencia)
      : 'none'
    await fetchApi('/api/publicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagenes: imagenes.map((img) => ({
          imgUrl: img.imgUrl,
          imgPath: img.imgPath,
          caption: img.caption,
        })),
        canales: form.canales,
        agentes: form.agentes,
        frecuencia,
        horaEnvio: form.horaEnvio,
        proximoEnvio: fechas[0]?.toISOString() || null
      })
    })
    setActivando(false)
    setModal(false)
    setPaso(1)
    setImagenes([])
    setForm({ frecuencia: '24h', horaEnvio: '08:00', fechaInicio: '', publicarAhora: false, repetir: true, frecuenciaCustom: '', canales: ['whatsapp'], agentes: [] })
    await loadData()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta publicación programada?')) return
    await fetchApi('/api/publicaciones', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData()
  }

  function toggleCanal(c: string) {
    setForm(f => ({ ...f, canales: f.canales.includes(c) ? f.canales.filter(x => x !== c) : [...f.canales, c] }))
  }

  function toggleAgente(a: string) {
    setForm(f => ({ ...f, agentes: f.agentes.includes(a) ? f.agentes.filter((x: string) => x !== a) : [...f.agentes, a] }))
  }

  const canPasar1 = imagenes.length > 0 && !subiendo
  const canPasar2 = form.canales.length > 0 && form.agentes.length > 0
  const canActivar = form.horaEnvio && canPasar2

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📢 Publicar</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Programa estados para WhatsApp, Instagram y Facebook</p>
        </div>
        <button onClick={() => { setModal(true); setPaso(1) }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2.5 rounded-xl font-semibold">
          + Nueva programación
        </button>
      </div>

      {publicaciones.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-sm">
          No hay publicaciones programadas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicaciones.map(p => {
            const canales = JSON.parse(p.canales || '[]') as string[]
            const ags = JSON.parse(p.agentes || '[]') as string[]
            const proximo = p.proximoEnvio ? new Date(p.proximoEnvio) : null
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <img src={p.imagenes?.[0]?.imagenUrl} alt="" className="w-full h-40 object-cover" />
                <div className="p-4 space-y-2">
                  {p.caption && <p className="text-white text-sm">{p.caption}</p>}
                  <div className="flex gap-1 flex-wrap">
                    {canales.map((c: string) => (
                      <span key={c} className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{c === 'whatsapp' ? '💬' : c === 'instagram' ? '📷' : '👍'} {c}</span>
                    ))}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {ags.join(', ')} · {p.frecuencia} · {p.enviados} enviados
                  </div>
                  {proximo && (
                    <div className="text-emerald-400 text-xs">
                      Próximo: {proximo.toLocaleString('es-CO')}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.estado === 'programada' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {p.estado === 'programada' ? '✅ Activa' : '⏸ Pausada'}
                    </span>
                    <button onClick={() => eliminar(p.id)} className="ml-auto text-red-400 text-xs hover:text-red-300">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Nueva programación</h3>
                <p className="text-zinc-500 text-xs">Paso {paso} de 3</p>
              </div>
              <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>

            <div className="flex gap-1 px-5 pt-4">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full ${paso >= s ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
              ))}
            </div>

            <div className="p-5 space-y-4">
              {paso === 1 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">📸 Sube tus imágenes</h4>
                  <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl p-8 text-zinc-400 text-sm text-center transition-colors">
                    {subiendo ? '⏳ Analizando con IA...' : '+ Toca para subir imágenes'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesChange} />
                  {imagenes.length > 0 && (
                    <div className="space-y-3">
                      {imagenes.map((img, i) => (
                        <div key={i} className="flex gap-3 bg-zinc-800 rounded-xl p-3">
                          <img src={img.preview} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={img.caption}
                              onChange={e => setImagenes(imgs => imgs.map((im, j) => j === i ? { ...im, caption: e.target.value } : im))}
                              placeholder="Caption sugerido por IA..."
                              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-xs outline-none resize-none"
                              rows={3}
                            />
                          </div>
                          <button onClick={() => setImagenes(imgs => imgs.filter((_, j) => j !== i))} className="text-red-400 text-xs self-start">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {paso === 2 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">📡 Selecciona canales y agentes</h4>
                  <div>
                    <p className="text-zinc-400 text-xs font-semibold mb-2">CANALES</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { id: 'whatsapp', label: '💬 WhatsApp', ready: true },
                        { id: 'instagram', label: '📷 Instagram', ready: false },
                        { id: 'facebook', label: '👍 Facebook', ready: false }
                      ].map(c => (
                        <button key={c.id} onClick={() => c.ready && toggleCanal(c.id)}
                          className={`px-4 py-2 rounded-xl text-sm border transition-colors ${form.canales.includes(c.id) ? 'bg-emerald-600 border-emerald-500 text-white' : c.ready ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'bg-zinc-800/50 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                          {c.label} {!c.ready && <span className="text-xs">🔜</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-xs font-semibold mb-2">AGENTES WHATSAPP</p>
                    <div className="space-y-2">
                      {agentes.filter((a: any) => a.activo && a.numero).map((a: any) => (
                        <button key={a.id} onClick={() => toggleAgente(a.instance)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${form.agentes.includes(a.instance) ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                          <span className="text-lg">🤖</span>
                          <div>
                            <p className="text-sm font-medium">{a.nombre || a.instance}</p>
                            <p className="text-xs text-zinc-500">+{a.numero}</p>
                          </div>
                          {form.agentes.includes(a.instance) && <span className="ml-auto text-emerald-400">✓</span>}
                        </button>
                      ))}
                      {agentes.filter((a: any) => a.activo && a.numero).length === 0 && (
                        <p className="text-zinc-500 text-sm">No hay agentes conectados</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paso === 3 && (
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">⏰ Programar envíos</h4>

                  <div>
                    <label className="text-zinc-400 text-xs font-semibold block mb-2">CUÁNDO PUBLICAR</label>
                    <div className="flex gap-2">
                      <button onClick={() => setForm(f => ({ ...f, publicarAhora: true }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${form.publicarAhora ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                        🚀 Ahora
                      </button>
                      <button onClick={() => setForm(f => ({ ...f, publicarAhora: false }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${!form.publicarAhora ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                        🕐 Programar
                      </button>
                    </div>
                  </div>

                  {!form.publicarAhora && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-zinc-400 text-xs font-semibold block mb-1">HORA DE INICIO</label>
                        <input type="time" value={form.horaEnvio} onChange={e => setForm(f => ({ ...f, horaEnvio: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="text-zinc-400 text-xs font-semibold block mb-1">FECHA INICIO (opcional)</label>
                        <input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-zinc-400 text-xs font-semibold">REPETIR</label>
                      <button onClick={() => setForm(f => ({ ...f, repetir: !f.repetir }))}
                        className={`w-10 h-5 rounded-full transition-colors ${form.repetir ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${form.repetir ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {form.repetir && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {[{ v: '12h', l: 'Cada 12h' }, { v: '24h', l: 'Cada 24h' }, { v: 'custom', l: '⚙️ Personalizado' }].map(f => (
                            <button key={f.v} onClick={() => setForm(fm => ({ ...fm, frecuencia: f.v }))}
                              className={`py-2 rounded-xl text-xs border transition-colors ${form.frecuencia === f.v ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                              {f.l}
                            </button>
                          ))}
                        </div>
                        {form.frecuencia === 'custom' && (
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" max="168" value={form.frecuenciaCustom}
                              onChange={e => setForm(f => ({ ...f, frecuenciaCustom: e.target.value }))}
                              placeholder="Ej: 6"
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
                            <span className="text-zinc-400 text-sm">horas</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-4 space-y-1">
                    <p className="text-zinc-400 text-xs font-semibold">RESUMEN</p>
                    <p className="text-white text-sm">
                      {imagenes.length} imagen(es) · {form.publicarAhora ? 'Ahora' : `a las ${form.horaEnvio}`}
                      {form.repetir ? ` · cada ${form.frecuencia === 'custom' ? (form.frecuenciaCustom || '?') + 'h' : form.frecuencia}` : ' · sin repetir'}
                    </p>
                    <p className="text-zinc-400 text-xs">{form.canales.join(', ')} · {form.agentes.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-5 py-4 flex gap-2">
              {paso > 1 && (
                <button onClick={() => setPaso(p => p - 1)} className="flex-1 bg-zinc-800 text-white text-sm py-3 rounded-xl">
                  ← Atrás
                </button>
              )}
              {paso < 3 ? (
                <button onClick={() => setPaso(p => p + 1)}
                  disabled={paso === 1 ? !canPasar1 : !canPasar2}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl">
                  Siguiente →
                </button>
              ) : (
                <button onClick={activar} disabled={!canActivar || activando}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl">
                  🚀 Activar programación
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

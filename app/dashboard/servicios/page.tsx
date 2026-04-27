'use client'
import { fetchApi } from '@/lib/fetchApi'
import { useEffect, useState } from 'react'

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', tipo: 'fijo', activo: true })

  useEffect(() => { loadServicios() }, [])

  async function loadServicios() {
    const res = await fetchApi('/api/servicios')
    if (res.ok) setServicios(await res.json())
  }

  async function guardar() {
    setGuardando(true)
    await fetchApi('/api/servicios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setGuardando(false)
    setModal(false)
    setForm({ nombre: '', descripcion: '', precio: '', tipo: 'fijo', activo: true })
    loadServicios()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    await fetchApi('/api/servicios', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadServicios()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🛠️ Servicios</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Gestiona los servicios que ofrece tu negocio</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl">
          + Nuevo servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🛠️</p>
          <p className="text-zinc-400">No hay servicios registrados aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servicios.map((s: any) => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{s.nombre}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.tipo === 'fijo' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {s.tipo === 'fijo' ? 'Precio fijo' : 'Cotización'}
                  </span>
                  {!s.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Inactivo</span>}
                </div>
                {s.descripcion && <p className="text-zinc-400 text-sm mt-0.5">{s.descripcion}</p>}
                {s.precio && <p className="text-emerald-400 text-sm font-medium mt-1">${Number(s.precio).toLocaleString('es-CO')}</p>}
              </div>
              <button onClick={() => eliminar(s.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Nuevo servicio</h3>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Ej: Consulta jurídica"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                placeholder="Describe el servicio brevemente"
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">Tipo de precio</label>
              <div className="flex gap-2">
                {['fijo', 'cotizacion'].map(t => (
                  <button key={t} onClick={() => setForm({...form, tipo: t})}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.tipo === t ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                    {t === 'fijo' ? '💰 Precio fijo' : '📋 Cotización'}
                  </button>
                ))}
              </div>
            </div>
            {form.tipo === 'fijo' && (
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Precio (COP)</label>
                <input type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})}
                  placeholder="Ej: 150000"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 bg-zinc-800 text-white text-sm py-3 rounded-xl">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre || guardando}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

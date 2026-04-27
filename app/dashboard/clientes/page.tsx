'use client'
import { fetchApi, errorMsg } from '@/lib/fetchApi'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'

export default function ClientesPage() {
  const { data: session } = useSession()
  const [contactos, setContactos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [etiquetaFiltro, setEtiquetaFiltro] = useState('')
  const [sel, setSel] = useState<any[]>([])
  const [modalAdd, setModalAdd] = useState(false)
  const [form, setForm] = useState({ nombre: '', numero: '', ciudad: '', email: '', etiqueta: '' })
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (etiquetaFiltro) params.set('etiqueta', etiquetaFiltro)
    const res = await fetchApi('/api/contactos?' + params)
    const data = await res.json()
    setContactos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.numero) return
    await fetchApi('/api/contactos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setModalAdd(false)
    setForm({ nombre: '', numero: '', ciudad: '', email: '', etiqueta: '' })
    load()
  }

  async function eliminarSel() {
    if (!confirm(`¿Eliminar ${sel.length} contacto(s)?`)) return
    await fetchApi('/api/contactos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: sel })
    })
    setSel([])
    load()
  }

  async function sincronizar() {
    setImportando(true)
    setImportMsg('')
    const res = await fetchApi('/api/contactos/sincronizar', { method: 'POST' })
    const data = await res.json()
    setImportMsg(`✅ ${data.creados} sincronizados desde WhatsApp`)
    setImportando(false)
    load()
  }

  async function importarCSV(e: any) {
    const file = e.target.files[0]
    if (!file) return
    setImportando(true)
    setImportMsg('')
    const text = await file.text()
    const lines = text.split('\n').filter((l: string) => l.trim().length > 0)
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
    const rows = lines.slice(1).map((line: string) => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: any = {}
      headers.forEach((h: string, i: number) => { obj[h] = vals[i] || '' })
      return obj
    }).filter((r: any) => r.numero || r.phone || r.celular || r.telefono)
    const normalized = rows.map((r: any) => ({
      numero: (r.numero || r.phone || r.celular || r.telefono || '').replace(/\D/g, ''),
      nombre: r.nombre || r.name || r.cliente || '',
      ciudad: r.ciudad || r.city || '',
      email: r.email || r.correo || '',
      etiqueta: r.etiqueta || r.tag || r.grupo || ''
    }))
    const res = await fetchApi('/api/contactos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    })
    const data = await res.json()
    setImportMsg(`✅ ${data.creados} importados, ${data.omitidos} omitidos`)
    setImportando(false)
    load()
  }

  const etiquetas = [...new Set(contactos.map(c => c.etiqueta).filter(Boolean))]
  const filtrados = contactos.filter(c => {
    const matchQ = !q || c.nombre?.toLowerCase().includes(q.toLowerCase()) || c.numero?.includes(q)
    const matchE = !etiquetaFiltro || c.etiqueta === etiquetaFiltro
    return matchQ && matchE
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{contactos.length} contactos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sel.length > 0 && (
            <button onClick={eliminarSel} className="bg-red-500/20 text-red-400 border border-red-500/30 text-sm px-3 py-2 rounded-xl">
              🗑️ Eliminar ({sel.length})
            </button>
          )}
          <button onClick={sincronizar} disabled={importando} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-xl disabled:opacity-50">
            {importando ? '⏳ Sincronizando...' : '🔄 Sincronizar WhatsApp'}
          </button>
          <button onClick={() => fileRef.current?.click()} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-2 rounded-xl">
            📥 Importar CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importarCSV} />
          <button onClick={() => setModalAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-2 rounded-xl font-semibold">
            + Agregar
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          {importMsg}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Buscar por nombre o número..."
          className="flex-1 min-w-[200px] max-w-md bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
        {etiquetas.length > 0 && (
          <select value={etiquetaFiltro} onChange={e => setEtiquetaFiltro(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none">
            <option value="">Todas las etiquetas</option>
            {etiquetas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
        <button onClick={load} className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-xl">Buscar</button>
      </div>

      {sel.length > 0 && (
        <div className="text-zinc-400 text-xs">{sel.length} seleccionados</div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No hay contactos. Importa un CSV o agrega uno manualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={sel.length === filtrados.length && filtrados.length > 0}
                      onChange={e => setSel(e.target.checked ? filtrados.map(c => c.id) : [])}
                      className="accent-emerald-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-zinc-400 font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left text-zinc-400 font-semibold">Número</th>
                  <th className="px-4 py-3 text-left text-zinc-400 font-semibold hidden md:table-cell">Ciudad</th>
                  <th className="px-4 py-3 text-left text-zinc-400 font-semibold hidden md:table-cell">Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={sel.includes(c.id)}
                        onChange={e => setSel(e.target.checked ? [...sel, c.id] : sel.filter(id => id !== c.id))}
                        className="accent-emerald-500" />
                    </td>
                    <td className="px-4 py-3 text-white">{c.nombre || <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">+{c.numero}</td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">{c.ciudad || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.etiqueta ? (
                        <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-full">{c.etiqueta}</span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-3">
            <h3 className="text-white font-bold text-lg">Agregar contacto</h3>
            {[['número *', 'numero', 'ej: 573001234567'], ['nombre', 'nombre', ''], ['ciudad', 'ciudad', ''], ['email', 'email', ''], ['etiqueta', 'etiqueta', 'ej: cliente, proveedor']].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-zinc-400 text-xs font-semibold block mb-1 capitalize">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={ph} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModalAdd(false)} className="flex-1 bg-zinc-800 text-white text-sm py-2.5 rounded-xl">Cancelar</button>
              <button onClick={guardar} disabled={!form.numero} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

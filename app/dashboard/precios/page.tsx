'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const FUNC_ICON: Record<string, string> = {
  agente: '🤖',
  posventa: '📦',
  publicaciones: '📅',
}

export default function PreciosCRMPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const [funcionalidades, setFuncionalidades] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  const [editando, setEditando] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return }
    if (user) cargar()
  }, [user])

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch('/api/precios').then(r => r.json())
      setFuncionalidades(res.funcionalidades || [])
      setEmpresas(res.resumenEmpresas || [])
    } catch(e) { console.log('Error cargar precios:', e) }
    setLoading(false)
  }

  async function guardarPrecio(codigo: string) {
    const precio = editando[codigo]
    if (!precio) return
    setGuardando(codigo)
    try {
      await fetch('/api/precios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, precio: parseInt(precio) })
      })
    } catch(e) { console.log('Error guardar precio:', e) }
    setGuardando(null)
    setEditando(prev => { const n = {...prev}; delete n[codigo]; return n })
    cargar()
  }

  const totalMensual = empresas.reduce((a, e) => a + e.total, 0)

  if (loading) return <div className="p-8 text-zinc-400 text-center">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Precios</h1>
        <p className="text-zinc-400 text-sm mt-1">Configura el valor mensual por funcionalidad</p>
      </div>

      {/* Funcionalidades */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-white font-semibold">Funcionalidades / mes</p>
        </div>
        {funcionalidades.map((f: any) => (
          <div key={f.codigo} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{FUNC_ICON[f.codigo] || '⚙️'}</span>
              <div>
                <p className="text-white text-sm font-medium">{f.nombre}</p>
                {f.descripcion && <p className="text-zinc-500 text-xs">{f.descripcion}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editando[f.codigo] !== undefined ? (
                <>
                  <span className="text-zinc-400 text-sm">$</span>
                  <input
                    type="number"
                    value={editando[f.codigo]}
                    onChange={e => setEditando(prev => ({ ...prev, [f.codigo]: e.target.value }))}
                    className="bg-zinc-800 border border-emerald-500 rounded-lg px-3 py-1.5 text-white text-sm w-28 outline-none"
                    onKeyDown={e => e.key === 'Enter' && guardarPrecio(f.codigo)}
                    autoFocus
                  />
                  <button onClick={() => guardarPrecio(f.codigo)} disabled={guardando === f.codigo}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg">
                    {guardando === f.codigo ? '...' : '✓'}
                  </button>
                  <button onClick={() => setEditando(prev => { const n = {...prev}; delete n[f.codigo]; return n })}
                    className="text-zinc-500 hover:text-white text-xs px-2 py-1.5 rounded-lg">✕</button>
                </>
              ) : (
                <>
                  <span className="text-white font-semibold">${f.precio.toLocaleString('es-CO')}</span>
                  <button onClick={() => setEditando(prev => ({ ...prev, [f.codigo]: String(f.precio) }))}
                    className="text-zinc-500 hover:text-white text-xs bg-zinc-800 px-2 py-1.5 rounded-lg ml-2">✏️</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
        <p className="text-emerald-400 font-semibold">💰 Facturación mensual total</p>
        <p className="text-emerald-400 font-bold text-xl">${totalMensual.toLocaleString('es-CO')}</p>
      </div>
    </div>
  )
}

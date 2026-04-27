'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function ConversacionesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [instance, setInstance] = useState('')

  useEffect(() => {
    if (!user) return
    const inst = user.instance || ''
    setInstance(inst)
    fetchChats(inst)
  }, [user])

  async function fetchChats(inst: string) {
    if (!inst) return
    try {
      const res = await fetch(`/api/conversaciones?instance=${inst}`)
      const data = await res.json()
      setChats(data.chats || [])
    } catch(e) { console.log('Error fetchChats:', e) }
    setLoading(false)
  }

  async function fetchHistorial(numero: string) {
    if (seleccionado === numero) {
      setSeleccionado(null)
      setHistorial([])
      return
    }
    try {
      const res = await fetch(`/api/conversaciones?instance=${instance}&numero=${numero}`)
      const data = await res.json()
      setHistorial(data.history || [])
      setSeleccionado(numero)
    } catch(e) { console.log('Error fetchHistorial:', e) }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Conversaciones</h1>
        <p className="text-zinc-400 mt-1">Historial de chats por cliente</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-white text-sm font-medium">Clientes</h3>
          </div>
          {loading ? (
            <div className="p-4 text-zinc-500 text-sm">Cargando...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-zinc-500 text-sm">No hay conversaciones</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {chats.map(chat => (
                <button key={chat.numero} onClick={() => fetchHistorial(chat.numero)}
                  className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors ${seleccionado === chat.numero ? 'bg-zinc-800' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 text-xs">👤</div>
                    <div>
                      <div className="text-white text-sm font-medium">{chat.nombre || 'Desconocido'}</div>
                      <div className="text-zinc-500 text-xs">+{chat.numero}</div>
                      <div className="text-zinc-500 text-xs">{instance}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-white text-sm font-medium">
              {seleccionado ? `+${seleccionado}` : 'Selecciona un cliente'}
            </h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[600px]">
            {historial.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-8">
                {seleccionado ? 'No hay mensajes' : 'Selecciona un cliente para ver el historial'}
              </div>
            ) : (
              historial.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

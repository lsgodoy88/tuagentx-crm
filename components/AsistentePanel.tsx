'use client'
import { useState, useRef, useEffect } from 'react'
import { fetchApi } from '@/lib/fetchApi'

type Msg = { rol: 'user' | 'bot'; texto: string; accion?: string | null; resultado?: any; escalar?: boolean }

export default function AsistentePanel({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Cargar historial
    fetchApi('/api/soporte/historial').then(hist => {
      if (Array.isArray(hist) && hist.length > 0) {
        setMsgs(hist.map((m: any) => ({ rol: m.rol as 'user' | 'bot', texto: m.texto, accion: m.accion })))
      } else {
        setMsgs([{ rol: 'bot', texto: '¡Hola! 👋 Soy tu asistente TuAgentX. Puedo ayudarte con tus ventas, agentes, productos y soporte técnico. ¿En qué te puedo ayudar hoy?' }])
      }
    })
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, cargando])

  async function enviar(texto?: string) {
    const t = (texto || input).trim()
    if (!t || cargando) return
    setInput('')
    setQr(null)
    const historial = msgs.map(m => ({ rol: m.rol === 'user' ? 'user' : 'assistant', texto: m.texto }))
    setMsgs(prev => [...prev, { rol: 'user', texto: t }])
    setCargando(true)
    const data = await fetchApi('/api/soporte/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: t, historial }),
    })
    setCargando(false)
    if (!data || !data.respuesta) {
      setMsgs(prev => [...prev, { rol: 'bot', texto: 'Error al conectar. Intenta de nuevo.' }])
    } else {
      setMsgs(prev => [...prev, { rol: 'bot', texto: data.respuesta, accion: data.accionEjecutada, resultado: data.resultado, escalar: data.escalar }])
      if (data.qr) setQr(data.qr)
    }
  }

  const sugerencias = ['📊 Resumen de ventas', '🤖 Estado de mi agente', '📦 Ver productos', '🔌 Reconectar WhatsApp']

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[998] md:bg-transparent" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 w-full md:w-[380px] h-full bg-zinc-900 border-l border-zinc-800 z-[999] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            🤖
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 border-2 border-zinc-900 rounded-full animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm">TuAgentX</h3>
            <p className="text-zinc-500 text-xs">Asistente inteligente · En línea</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors">✕</button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.rol === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${m.rol === 'bot' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-zinc-700'}`}>
                {m.rol === 'bot' ? '🤖' : '👤'}
              </div>
              <div className="max-w-[80%]">
                <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.rol === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'}`}>
                  {m.texto}
                </div>
                {null}
                {m.resultado && (
                  <div className="mt-1 text-xs bg-zinc-800 rounded-lg px-2 py-1 text-zinc-300">
                    {m.resultado.estado && <span>Estado: <b>{m.resultado.estado}</b> {m.resultado.conectado ? '✅' : '❌'}</span>}
                    {m.resultado.eliminadas !== undefined && <span>🗑️ {m.resultado.eliminadas} registros eliminados</span>}
                    {m.resultado.reiniciado && <span>🔄 Reiniciado correctamente</span>}
                    {m.resultado.mensaje && <span>{m.resultado.mensaje}</span>}
                    {null}
                  </div>
                )}
                {m.escalar && (
                  <a href="https://wa.me/573164349389" target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    💬 Hablar con un asesor
                  </a>
                )}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm">🤖</div>
              <div className="bg-zinc-800 px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
              </div>
            </div>
          )}
          {qr && (
            <div className="bg-white p-3 rounded-2xl w-fit mx-auto">
              <img src={qr} alt="Código de vinculación" className="w-48 h-48" />
              <p className="text-zinc-700 text-xs text-center mt-2">Escanea para vincular</p>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Sugerencias */}
        {msgs.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {sugerencias.map((s, i) => (
              <button key={i} onClick={() => enviar(s.replace(/^[^\s]+\s/, ''))}
                className="bg-zinc-800 hover:bg-emerald-500/10 border border-zinc-700 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-full px-3 py-1.5 text-xs transition-colors whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-zinc-800 flex gap-2 items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder="Escribe tu pregunta..."
            disabled={cargando}
            className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button onClick={() => enviar()} disabled={cargando || !input.trim()}
            className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            ➤
          </button>
        </div>
      </div>
    </>
  )
}

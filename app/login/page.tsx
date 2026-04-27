'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')


    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (res?.error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'#040f0a'}}>
        <div className="w-full max-w-md">
          <div className="text-center mb-5">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#10b981'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">TuAgent<span style={{color:'#10b981'}}>X</span></span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{color:'#10b981',background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.25)'}}>CRM</span>
            </Link>
            <p className="text-sm" style={{color:'#6b7280'}}>CRM WhatsApp con IA</p>
          </div>
          <div className="rounded-2xl p-8" style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(16,185,129,.12)'}}>
            <h2 className="text-white font-semibold text-xl mb-6">Iniciar sesión</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm mb-1.5 block" style={{color:'#9ca3af'}}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  style={{background:'#0a0a0a',border:'1px solid rgba(16,185,129,.15)'}}
                  onFocus={e => e.target.style.borderColor='rgba(16,185,129,.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(16,185,129,.15)'}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm mb-1.5 block" style={{color:'#9ca3af'}}>Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 pr-10 text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    style={{background:'#0a0a0a',border:'1px solid rgba(16,185,129,.15)'}}
                    onFocus={e => e.target.style.borderColor='rgba(16,185,129,.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(16,185,129,.15)'}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {showPass
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171'}}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold rounded-xl py-3 transition-colors mt-2"
                style={{background:'#10b981',color:'#000',opacity:loading?0.6:1,animation:'fadeIn .4s ease'}}
              >
                {loading ? 'Ingresando...' : 'Ingresar →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

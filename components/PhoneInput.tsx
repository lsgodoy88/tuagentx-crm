'use client'
import { useState, useEffect, useRef } from 'react'

const PAISES = [
  { code: '57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '1',   flag: '🇺🇸', name: 'USA/Canadá' },
  { code: '52',  flag: '🇲🇽', name: 'México' },
  { code: '54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '56',  flag: '🇨🇱', name: 'Chile' },
  { code: '51',  flag: '🇵🇪', name: 'Perú' },
  { code: '58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '34',  flag: '🇪🇸', name: 'España' },
]

type WaStatus = 'idle' | 'checking' | 'valid' | 'invalid'

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  placeholder?: string
  className?: string
  onValidChange?: (valid: boolean) => void
  checkWhatsapp?: boolean
}

function isValidPhone(cod: string, num: string) {
  return (cod + num).replace(/\D/g, '').length >= 10 && num.length >= 7
}

export default function PhoneInput({ value, onChange, placeholder = '3001234567', className = '', onValidChange, checkWhatsapp }: PhoneInputProps) {
  const [codigo, setCodigo]   = useState('57')
  const [numero, setNumero]   = useState('')
  const [abierto, setAbierto] = useState(false)
  const [touched, setTouched] = useState(false)
  const [waStatus, setWaStatus] = useState<WaStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Al recibir valor externo, separar código y número
  useEffect(() => {
    if (!value) { setNumero(''); return }
    const pais = PAISES.find(p => value.startsWith(p.code))
    if (pais) {
      setCodigo(pais.code)
      setNumero(value.slice(pais.code.length))
    } else {
      setNumero(value)
    }
  }, [])

  async function verificarWhatsapp(fullNumero: string) {
    try {
      const r = await fetch('/api/validar-whatsapp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ numero: fullNumero }),
      })
      const d = await r.json()
      setWaStatus(d.valido ? 'valid' : 'invalid')
      onValidChange?.(d.valido)
    } catch {
      setWaStatus('idle')
    }
  }

  function handleNumero(val: string) {
    const soloNumeros = val.replace(/\D/g, '')
    setNumero(soloNumeros)
    setTouched(true)
    const full  = codigo + soloNumeros
    const valid = isValidPhone(codigo, soloNumeros)

    if (checkWhatsapp) {
      clearTimeout(debounceRef.current)
      if (valid) {
        setWaStatus('checking')
        onValidChange?.(false) // pendiente hasta confirmar
        debounceRef.current = setTimeout(() => verificarWhatsapp(full), 1000)
      } else {
        setWaStatus('idle')
        onValidChange?.(false)
      }
    } else {
      onValidChange?.(valid)
    }

    onChange(full)
  }

  function handleCodigo(code: string) {
    setCodigo(code)
    setAbierto(false)
    const full  = code + numero
    const valid = isValidPhone(code, numero)

    if (checkWhatsapp) {
      clearTimeout(debounceRef.current)
      if (valid) {
        setWaStatus('checking')
        onValidChange?.(false)
        debounceRef.current = setTimeout(() => verificarWhatsapp(full), 1000)
      } else {
        setWaStatus('idle')
        onValidChange?.(false)
      }
    } else {
      onValidChange?.(valid)
    }

    onChange(full)
  }

  const paisActual  = PAISES.find(p => p.code === codigo) || PAISES[0]
  const formatError = touched && !isValidPhone(codigo, numero)

  // Color del borde: rojo si formato mal, verde si WA válido, normal resto
  const borderClass = formatError
    ? 'border-red-500 focus:border-red-400'
    : checkWhatsapp && waStatus === 'valid'
      ? 'border-emerald-500 focus:border-emerald-400'
      : checkWhatsapp && waStatus === 'invalid'
        ? 'border-red-500 focus:border-red-400'
        : 'border-zinc-700 focus:border-emerald-500'

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-0">
        {/* Selector de país */}
        <div className="relative">
          <button type="button" onClick={() => setAbierto(!abierto)}
            className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-xl px-3 py-2.5 text-white text-sm hover:bg-zinc-700 transition-colors whitespace-nowrap">
            <span>{paisActual.flag}</span>
            <span className="text-zinc-400">+{codigo}</span>
            <span className="text-zinc-600 text-xs">▼</span>
          </button>
          {abierto && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 min-w-48 overflow-hidden">
              {PAISES.map(p => (
                <button key={p.code} type="button" onClick={() => handleCodigo(p.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700 transition-colors text-left ${p.code === codigo ? 'text-emerald-400' : 'text-white'}`}>
                  <span>{p.flag}</span>
                  <span>{p.name}</span>
                  <span className="ml-auto text-zinc-500">+{p.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Input número */}
        <input
          type="tel"
          value={numero}
          onChange={e => handleNumero(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-zinc-800 border rounded-r-xl px-3 py-2.5 text-white text-sm outline-none min-w-0 transition-colors ${borderClass}`}
        />
      </div>

      {/* Mensajes de estado */}
      {formatError && (
        <p className="text-red-400 text-xs mt-1.5 ml-1">Número inválido — mínimo 10 dígitos</p>
      )}
      {checkWhatsapp && !formatError && waStatus === 'checking' && (
        <p className="text-zinc-400 text-xs mt-1.5 ml-1">🔄 Verificando WhatsApp...</p>
      )}
      {checkWhatsapp && !formatError && waStatus === 'valid' && (
        <p className="text-emerald-400 text-xs mt-1.5 ml-1">✅ WhatsApp válido</p>
      )}
      {checkWhatsapp && !formatError && waStatus === 'invalid' && (
        <p className="text-red-400 text-xs mt-1.5 ml-1">❌ Este número no tiene WhatsApp</p>
      )}
    </div>
  )
}

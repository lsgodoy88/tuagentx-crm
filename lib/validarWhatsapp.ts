/**
 * Lógica compartida de validación de WhatsApp via Evolution API.
 * Usada por /api/validar-whatsapp (admin panel) y cualquier otro endpoint que lo necesite.
 */

const EVO_URL      = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_APIKEY   = process.env.EVOLUTION_API_KEY || ''
const NOTIF_INSTANCE = process.env.NOTIF_INSTANCE  || 'TuAgentX_bot'

export function normalizarNumero(numero: string): string | null {
  const digits = numero.replace(/\D/g, '')
  if (digits.length < 10) return null
  // Si son exactamente 10 dígitos (móvil colombiano sin prefijo), añadir 57
  return digits.length === 10 ? `57${digits}` : digits
}

export async function validarWhatsapp(numero: string): Promise<boolean> {
  const normalized = normalizarNumero(numero)
  if (!normalized) return false

  try {
    const res = await fetch(`${EVO_URL}/chat/whatsappNumbers/${NOTIF_INSTANCE}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_APIKEY },
      body:    JSON.stringify({ numbers: [normalized] }),
      signal:  AbortSignal.timeout(8_000),
    })

    if (!res.ok) return true // Evolution no disponible → no bloquear

    const data = await res.json()
    const entry = Array.isArray(data) ? data[0] : null
    return entry ? (entry.exists ?? entry.numberExists ?? true) : true
  } catch {
    // Evolution caído o timeout → no bloquear el flujo
    return true
  }
}

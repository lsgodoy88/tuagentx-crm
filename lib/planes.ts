export const PLAN_BOTS: Record<string, number> = { basico: 1, pro: 2, business: 3 }
export const PLAN_ORDEN = ['basico', 'pro', 'business']
export const PLAN_LABELS: Record<string, string> = { basico: 'Básico', pro: 'Pro', business: 'Business' }

export function calcularUpgrade(planActual: string, planNuevo: string, precios: any[]): number {
  const precioAgente = precios.find((p: any) => p.codigo === 'agente')?.precio || 100000
  const botsActuales = PLAN_BOTS[planActual] || 1
  const botsNuevos   = PLAN_BOTS[planNuevo]   || 1
  return (botsNuevos - botsActuales) * precioAgente
}

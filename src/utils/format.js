const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// La API devuelve fechas ISO 8601 con el huso del local (-03:00). Se leen los
// componentes tal cual vienen para mostrar la hora del local aunque el
// navegador esté en otra zona horaria.
export function parseLocal(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || '')
  if (!match) return null
  const [year, month, day, hour = 0, minute = 0] = match.slice(1).map((part) => Number(part || 0))
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return { year, month, day, hour, minute, weekday }
}

const pad = (n) => String(n).padStart(2, '0')
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function formatLongDate(iso) {
  const parts = parseLocal(iso)
  if (!parts) return ''
  return capitalize(`${DAYS[parts.weekday]} ${parts.day} de ${MONTHS[parts.month - 1]}`)
}

export function formatTime(iso) {
  const parts = parseLocal(iso)
  return parts ? `${pad(parts.hour)}:${pad(parts.minute)}` : ''
}

export function formatDateTime(iso) {
  return `${formatLongDate(iso)}, ${formatTime(iso)} hs`
}

export function monthShort(iso) {
  const parts = parseLocal(iso)
  return parts ? MONTHS[parts.month - 1].slice(0, 3) : ''
}

export function dayOfMonth(iso) {
  return parseLocal(iso)?.day ?? ''
}

export function money(amount) {
  return currency.format(Number(amount) || 0)
}

export function duration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min`
  return mins ? `${hours} h ${mins} min` : `${hours} h`
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDays(isoDate, days) {
  const { year, month, day } = parseLocal(isoDate)
  return toISODate(new Date(year, month - 1, day + days))
}

export function isSunday(isoDate) {
  return parseLocal(isoDate)?.weekday === 0
}

// Primer día de atención desde hoy (los domingos no se atiende).
export function nextOpenDay() {
  const today = todayISO()
  return isSunday(today) ? addDays(today, 1) : today
}

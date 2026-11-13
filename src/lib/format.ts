const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Formats a date (Date or YYYY-MM-DD) as "November 12, 2026" without time zone drift. */
export function longDate(value: Date | string | null | undefined) {
  if (!value) return ''
  const iso = isoDate(value)
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

export function isoDate(value: Date | string) {
  if (typeof value === 'string') return value.slice(0, 10)
  // DATE columns arrive as local midnight; read the calendar date back the same way.
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m === 0) return `${rest} sec`
  return rest ? `${m} min ${rest} sec` : `${m} min`
}

export function dateTime(value: Date | string | null | undefined) {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  return (
    d.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET'
  )
}

/** Today's calendar date for the school (Eastern time). */
export function schoolToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
  return parts // YYYY-MM-DD
}

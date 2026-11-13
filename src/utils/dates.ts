export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function toDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function todayInput() {
  return toDateInput(new Date())
}

export function formatLongDate(isoDate: string) {
  const date = parseDateInput(isoDate.slice(0, 10))
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(isoDate: string) {
  const date = parseDateInput(isoDate.slice(0, 10))
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function formatWhen(value: string) {
  if (!value) return ''
  const date = value.length > 10 ? new Date(value) : parseDateInput(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: value.length > 10 ? 'numeric' : undefined,
    minute: value.length > 10 ? '2-digit' : undefined,
  }).format(date)
}

export function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function weekBounds(anchor = new Date()) {
  const start = new Date(anchor)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: toDateInput(start), end: toDateInput(end) }
}

export function inRange(value: string, start: string, end: string) {
  const day = value.slice(0, 10)
  return day >= start && day <= end
}

export function nowLocalStamp() {
  const date = new Date()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${toDateInput(date)}T${time}`
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function startOfWeek(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + offset)
  return copy
}

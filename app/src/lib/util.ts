import { format, isToday as fnsIsToday, isTomorrow as fnsIsTomorrow, parseISO } from 'date-fns'

export function todayStr(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseDateLocal(s: string): Date {
  return parseISO(s)
}

export function dayLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (fnsIsToday(d)) return 'Today'
  if (fnsIsTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEEE, MMMM d')
}

export function longDayLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  return format(d, 'EEEE')
}

export function subLabel(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM d')
}

/** 90 → "1:30" */
export function fmtMinutes(min: number): string {
  if (!min) return '0:00'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** 90 → "1h 30m" */
export function fmtMinutesLong(min: number): string {
  if (!min) return '0m'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

/** "13:30" → 810 */
export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 810 → "13:30" */
export function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 810 → "1:30 PM" */
export function fmtTime12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''} ${ampm}`
}

export function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return format(new Date(iso), 'MMM d')
}

export const AVATAR_COLORS = ['#7C5CFC', '#38BDF8', '#22D3EE', '#EC4899', '#34D399', '#A78BFA', '#F471B5', '#14B8A6']

export function timeColorClass(color: string): string {
  switch (color) {
    case 'blue': return 'bg-[#7CA6F0] hover:bg-[#6a97e6]'
    case 'purple': return 'bg-[#A78BFA] hover:bg-[#9a7cf4]'
    case 'amber': return 'bg-[#F0A742] hover:bg-[#eb9d33]'
    case 'pink': return 'bg-[#F06AA8] hover:bg-[#ee5c9f]'
    case 'green': return 'bg-[#5FC48F] hover:bg-[#52b983]'
    default: return 'bg-[#7CA6F0] hover:bg-[#6a97e6]'
  }
}

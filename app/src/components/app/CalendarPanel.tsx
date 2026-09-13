import { useState } from 'react'
import { api } from '../../lib/api'
import { fmtTime12, minToTime, timeColorClass, timeToMin } from '../../lib/util'
import { getIssueDrag } from './TaskCard'
import type { CalEvent, Issue } from '../../lib/types'

const DAY_START = 7 * 60 // 7 AM
const DAY_END = 21 * 60 // 9 PM
const PX_PER_MIN = 0.85

export default function CalendarPanel({
  date,
  events,
  issues,
  onChanged,
}: {
  date: string
  events: CalEvent[]
  issues: Issue[] // scheduled on this date
  onChanged: () => void
}) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const height = (DAY_END - DAY_START) * PX_PER_MIN

  const drop = async (e: React.DragEvent, slotStartMin: number) => {
    e.preventDefault()
    setDragOverSlot(null)
    const id = getIssueDrag(e)
    if (!id) return
    const duration = Number(e.dataTransfer.getData('text/cortex-duration')) || 60
    await api(`/issues/${id}/schedule`, {
      method: 'POST',
      body: { scheduledDate: date, startTime: minToTime(slotStartMin), durationMinutes: duration },
    })
    onChanged()
  }

  return (
    <div className="flex h-full w-[290px] shrink-0 flex-col border-l border-white/10 bg-[#101024]" data-testid="calendar-panel">
      <div className="flex items-baseline justify-between border-b border-white/[0.07] px-4 py-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-600">
            {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
          </p>
          <p className="text-2xl font-bold leading-none text-slate-200">{Number(date.slice(8, 10))}</p>
        </div>
        <p className="text-[11px] font-medium text-slate-600">{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="relative flex-1 overflow-y-auto app-scroll" style={{ height }}>
        <div className="relative" style={{ height }}>
          {Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }).map((_, i) => {
            const min = DAY_START + i * 60
            const h24 = Math.floor(min / 60) % 24
            return (
              <div key={min} className="absolute left-0 right-0 flex items-start gap-1.5" style={{ top: (min - DAY_START) * PX_PER_MIN }}>
                <span className="w-10 shrink-0 pt-[-4px] text-right text-[9.5px] font-medium text-slate-600">
                  {h24 === 0 ? '12 AM' : h24 < 12 ? `${h24} AM` : h24 === 12 ? '12 PM' : `${h24 - 12} PM`}
                </span>
                <span className="mt-[5px] h-px flex-1 bg-[#101024]/10" />
              </div>
            )
          })}

          {/* drop slots (one per 30 min) */}
          {Array.from({ length: (DAY_END - DAY_START) / 30 }).map((_, i) => {
            const min = DAY_START + i * 30
            const slotId = `slot-${min}`
            return (
              <div
                key={slotId}
                onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slotId) }}
                onDragLeave={() => setDragOverSlot((s) => (s === slotId ? null : s))}
                onDrop={(e) => drop(e, min)}
                className="absolute left-11 right-2"
                style={{ top: (min - DAY_START) * PX_PER_MIN, height: 30 * PX_PER_MIN }}
              >
                {dragOverSlot === slotId && (
                  <div className="h-full rounded-md border-2 border-dashed border-[#7C5CFC]/60 bg-indigo-500/10" />
                )}
              </div>
            )
          })}

          {/* calendar events */}
          {events.map((ev) => {
            const start = timeToMin(ev.start_time)
            return (
              <div
                key={ev.id}
                className={`absolute left-11 right-2 rounded-md px-2 py-1 text-[11px] font-semibold leading-tight text-white shadow-sm ${timeColorClass(ev.color)}`}
                style={{ top: (start - DAY_START) * PX_PER_MIN, height: Math.max(ev.duration_minutes * PX_PER_MIN - 2, 18) }}
              >
                {ev.title}
                <span className="block text-[9.5px] font-normal opacity-90">
                  {fmtTime12(ev.start_time)} – {fmtTime12(minToTime(start + ev.duration_minutes))}
                </span>
              </div>
            )
          })}

          {/* timeboxed tasks */}
          {issues.filter((i) => i.start_time && !i.completed_at).map((i) => {
            const start = timeToMin(i.start_time!)
            const dur = i.duration_minutes || i.estimate_minutes || 60
            return (
              <div
                key={i.id}
                data-testid="calendar-task"
                className="absolute left-11 right-2 overflow-hidden rounded-md border border-white/70 px-2 py-1 text-[11px] font-semibold leading-tight text-white shadow-md"
                style={{
                  top: (start - DAY_START) * PX_PER_MIN,
                  height: Math.max(dur * PX_PER_MIN - 2, 18),
                  background: i.project_color ?? '#7CA6F0',
                }}
                title={`${i.title} · ${fmtTime12(i.start_time ?? "00:00")}`}
              >
                <p className="truncate">{i.title}</p>
                <p className="text-[9.5px] font-normal opacity-90">
                  {fmtTime12(i.start_time ?? "00:00")} – {fmtTime12(minToTime(start + dur))}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      <p className="border-t border-white/[0.07] px-4 py-2 text-[11px] text-slate-600">Drag a task onto the grid to timebox it</p>
    </div>
  )
}

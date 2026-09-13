import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import TaskCard, { getIssueDrag } from '../../components/app/TaskCard'
import CalendarPanel from '../../components/app/CalendarPanel'
import { dayLabel, fmtMinutes, subLabel, todayStr } from '../../lib/util'
import type { CalEvent, Issue } from '../../lib/types'

export default function Today() {
  const { team } = useWorkspace()
  const [days, setDays] = useState<{ date: string; issues: Issue[] }[]>([])
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showCalendar, setShowCalendar] = useState(true)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [composerDate, setComposerDate] = useState<string | null>(null)
  const [composerText, setComposerText] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const from = todayStr(0)
      const to = todayStr(1)
      const [a, b, ev] = await Promise.all([
        api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&scheduledFrom=${from}&scheduledTo=${from}`),
        api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&scheduledFrom=${to}&scheduledTo=${to}`),
        api<{ events: CalEvent[] }>(`/teams/${team.id}/events?from=${from}&to=${from}`),
      ])
      setDays([
        { date: from, issues: a.issues },
        { date: to, issues: b.issues },
      ])
      setEvents(ev.events)
    } finally {
      setLoading(false)
    }
  }, [team])

  useEffect(() => { load() }, [load])

  const dropToDate = async (e: React.DragEvent, date: string) => {
    e.preventDefault()
    setDragOverDate(null)
    const id = getIssueDrag(e)
    if (!id) return
    await api(`/issues/${id}/schedule`, { method: 'POST', body: { scheduledDate: date } })
    load()
  }

  const addTask = async (date: string) => {
    if (!composerText.trim() || !team) return
    await api('/issues', {
      method: 'POST',
      body: { teamId: team.id, title: composerText.trim(), scheduledDate: date, estimateMinutes: 30 },
    })
    setComposerText('')
    setComposerDate(null)
    load()
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-stone-200/70 bg-white/60 px-5 py-2.5">
          <div className="flex items-center gap-1.5">
            <Link to="/app" className="rounded-md bg-stone-200/70 px-3 py-1.5 text-[13px] font-bold text-stone-800">☰ Today</Link>
            <Link to="/app/board" className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-stone-500 transition hover:bg-stone-100">⊞ Board</Link>
          </div>
          <button
            type="button"
            onClick={() => setShowCalendar((s) => !s)}
            className="rounded-md border border-stone-200 px-3 py-1.5 text-[13px] font-semibold text-stone-500 transition hover:bg-stone-100"
          >
            ▤ {showCalendar ? 'Hide' : 'Show'} calendar
          </button>
        </div>

        {/* day columns */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 app-scroll">
          {loading && days.length === 0 ? (
            <div className="flex w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#F2742D]" />
            </div>
          ) : (
            days.map(({ date, issues }) => {
              const plannedMin = issues.reduce((s, i) => s + (i.completed_at ? 0 : (i.duration_minutes || i.estimate_minutes)), 0)
              const capacity = 8 * 60
              const loadPct = Math.min(100, Math.round((plannedMin / capacity) * 100))
              const doneCount = issues.filter((i) => i.completed_at).length
              return (
                <div
                  key={date}
                  data-testid="day-column"
                  onDragOver={(e) => { e.preventDefault(); setDragOverDate(date) }}
                  onDragLeave={() => setDragOverDate((d) => (d === date ? null : d))}
                  onDrop={(e) => dropToDate(e, date)}
                  className={`flex w-[300px] shrink-0 flex-col rounded-xl border p-3 transition ${
                    dragOverDate === date ? 'border-[#F2742D] bg-orange-50/60' : 'border-stone-200/70 bg-white/50'
                  }`}
                >
                  <div className="px-1">
                    <p className="text-[15px] font-bold text-stone-900">{dayLabel(date)}</p>
                    <p className="text-[12px] text-stone-400">{subLabel(date)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-[5px] flex-1 rounded-full bg-stone-200/70">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${loadPct}%`, background: loadPct > 90 ? '#EF4444' : loadPct > 60 ? '#F0A742' : '#5FC48F' }}
                        />
                      </div>
                      <span className="text-[10.5px] font-semibold text-stone-400">{fmtMinutes(plannedMin)} planned</span>
                    </div>
                    {doneCount > 0 && <p className="mt-1 text-[11px] font-medium text-[#22A55C]">✓ {doneCount} done</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setComposerDate(date); setComposerText('') }}
                    data-testid={`add-task-${date}`}
                    className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-stone-300 bg-white/70 px-3 py-2 text-left transition hover:border-[#F2742D] hover:bg-orange-50/40"
                  >
                    <span className="text-[13px] font-semibold text-stone-400">+ Add task</span>
                    <span className="text-[11px] font-bold text-stone-300">8:00</span>
                  </button>

                  {composerDate === date && (
                    <div className="mt-2">
                      <input
                        autoFocus
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addTask(date); if (e.key === 'Escape') setComposerDate(null) }}
                        onBlur={() => { if (!composerText.trim()) setComposerDate(null) }}
                        placeholder="Task title, press Enter"
                        data-testid="task-title-input"
                        className="w-full rounded-lg border border-[#F2742D] bg-white px-3 py-2 text-[13px] outline-none ring-2 ring-orange-100"
                      />
                      <div className="mt-1.5 flex gap-1.5">
                        <button type="button" onMouseDown={(e) => { e.preventDefault(); addTask(date) }} className="btn-orange h-7 px-3 text-[12px]">Add</button>
                        <button type="button" onClick={() => setComposerDate(null)} className="h-7 rounded-full border border-stone-200 px-3 text-[12px] font-semibold text-stone-500">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto app-scroll" data-testid="task-list">
                    {issues.map((i) => (
                      <TaskCard key={i.id} issue={i} onToggleDone={load} />
                    ))}
                    {issues.length === 0 && (
                      <p className="px-1 pt-2 text-center text-[12.5px] text-stone-400">
                        Nothing planned yet — add a task or drop one here.
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}

          <Link
            to="/app/planning"
            className="flex h-fit w-[180px] shrink-0 flex-col items-start gap-1 rounded-xl border border-dashed border-stone-300 p-4 text-left transition hover:border-[#F2742D] hover:bg-orange-50/40"
          >
            <span className="text-[13px] font-bold text-stone-500">✎ Daily planning</span>
            <span className="text-[11.5px] leading-snug text-stone-400">Pull work from your backlog into a realistic day</span>
          </Link>
        </div>
      </div>

      {showCalendar && team && (
        <CalendarPanel date={todayStr(0)} events={events} issues={days[0]?.issues ?? []} onChanged={load} />
      )}
    </div>
  )
}

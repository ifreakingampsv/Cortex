import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, todayStr } from '../../lib/util'
import type { Highlight, Issue } from '../../lib/types'

export default function Shutdown() {
  const { team, statuses } = useWorkspace()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Issue[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [highlightText, setHighlightText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!team) return
    const today = todayStr(0)
    const [t, h] = await Promise.all([
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&scheduledFrom=${today}&scheduledTo=${today}`),
      api<{ highlights: Highlight[] }>(`/teams/${team.id}/highlights?date=${today}`),
    ])
    setTasks(t.issues)
    setHighlights(h.highlights)
  }, [team])

  useEffect(() => { load() }, [load])

  const open = tasks.filter((t) => !t.completed_at)
  const done = tasks.filter((t) => t.completed_at)
  const dayComplete = open.length === 0 && highlightText.trim() === '' && highlights.length > 0

  const markDone = async (i: Issue) => {
    const doneStatus = statuses.find((s) => s.category === 'completed')
    if (!doneStatus) return
    await api(`/issues/${i.id}`, { method: 'PATCH', body: { statusId: doneStatus.id } })
    load()
  }

  const moveToTomorrow = async (i: Issue) => {
    await api(`/issues/${i.id}/schedule`, { method: 'POST', body: { scheduledDate: todayStr(1), startTime: null } })
    load()
  }

  const saveHighlight = async () => {
    if (!highlightText.trim()) return
    setBusy(true)
    try {
      await api(`/teams/${team!.id}/highlights`, { method: 'POST', body: { body: highlightText.trim(), date: todayStr(0) } })
      setHighlightText('')
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto px-4 py-8 app-scroll">
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#8B5CF6]">5 PM · DAILY SHUTDOWN</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100">Wrap up your day</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Review what got done, push the rest to tomorrow, and capture today's highlight.</p>
      </div>

      <div className="mt-7 space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#101024] p-5" data-testid="shutdown-open">
          <h2 className="text-[13px] font-bold text-slate-200">Still open ({open.length})</h2>
          {open.length === 0 ? (
            <p className="mt-3 rounded-lg bg-green-50 px-3 py-2.5 text-[13.5px] font-semibold text-green-700">✓ Everything planned for today is done. Nice work.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {open.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#101024]/[0.04] px-3.5 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-slate-300">{i.title}</span>
                  <span className="text-[11.5px] font-semibold text-slate-600">{fmtMinutes(i.duration_minutes || i.estimate_minutes)}</span>
                  <button type="button" onClick={() => markDone(i)} className="rounded-full bg-[#22C55E]/10 px-3 py-1 text-[12px] font-bold text-[#16A34A] transition hover:bg-[#22C55E]/20">✓ Done</button>
                  <button type="button" onClick={() => moveToTomorrow(i)} data-testid={`move-tomorrow-${i.id}`} className="rounded-full bg-indigo-500/15 px-3 py-1 text-[12px] font-bold text-slate-400 transition hover:bg-indigo-500/15">→ Tomorrow</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#101024] p-5">
          <h2 className="text-[13px] font-bold text-slate-200">Completed today ({done.length})</h2>
          <div className="mt-3 space-y-1.5">
            {done.map((i) => (
              <p key={i.id} className="flex items-center gap-2 text-[13.5px] text-slate-500">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5FC48F] text-[9px] text-white">✓</span>
                <span className="line-through">{i.title}</span>
              </p>
            ))}
            {done.length === 0 && <p className="text-[13px] text-slate-600">Nothing completed yet today.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-[#15143A] to-[#101024] p-5">
          <h2 className="text-[13px] font-bold text-slate-200">Today's highlight</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500">What went well? What are you proud of? (Saved to your team's highlights.)</p>
          <textarea
            value={highlightText}
            onChange={(e) => setHighlightText(e.target.value)}
            rows={3}
            data-testid="highlight-input"
            placeholder="Today I…"
            className="mt-3 w-full resize-none rounded-xl border border-white/10 px-3.5 py-2.5 text-[13.5px] outline-none transition focus:border-[#7C5CFC]"
          />
          <button type="button" disabled={!highlightText.trim() || busy} onClick={saveHighlight} className="btn-orange mt-3 h-10 px-5 text-[14px] disabled:cursor-not-allowed disabled:bg-indigo-500/15 disabled:text-slate-600 disabled:shadow-none">
            Save highlight
          </button>
          {highlights.length > 0 && (
            <div className="mt-4 space-y-2">
              {highlights.map((h) => (
                <p key={h.id} className="rounded-lg bg-[#101024] px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-300 ring-1 ring-indigo-500/20">
                  <span className="font-bold text-slate-200">{h.user_name}:</span> {h.body}
                </p>
              ))}
            </div>
          )}
        </section>

        {dayComplete && (
          <div className="rounded-2xl bg-[#0A0A1C] p-6 text-center" data-testid="day-complete">
            <p className="text-lg font-bold text-white">🌅 Day complete</p>
            <p className="mt-1 text-[13px] text-slate-700">You planned, executed, and reflected. Close the laptop with confidence.</p>
            <button type="button" onClick={() => navigate('/app')} className="btn-orange mt-4 h-10 px-6 text-[14px]">Back to Today</button>
          </div>
        )}
      </div>
    </div>
  )
}

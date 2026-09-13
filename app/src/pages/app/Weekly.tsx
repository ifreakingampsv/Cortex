import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutesLong, todayStr } from '../../lib/util'
import type { Analytics, Issue } from '../../lib/types'

function mondayOf(d: Date): string {
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  return todayStr(-diff)
}

/** Weekly planning (pick the week's focus) + weekly review (what got done). */
export default function Weekly() {
  const { team } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'review' ? 'review' : 'plan'
  const [openIssues, setOpenIssues] = useState<Issue[]>([])
  const [focusIds, setFocusIds] = useState<Set<string>>(new Set())
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const weekStart = mondayOf(new Date())

  const load = useCallback(async () => {
    if (!team) return
    const [open, a] = await Promise.all([
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&completed=0`),
      api<Analytics>(`/teams/${team.id}/analytics?from=${weekStart}&to=${todayStr(0)}`),
    ])
    setOpenIssues(open.issues)
    setAnalytics(a)
    setFocusIds(new Set(open.issues.filter((i) => i.due_date && i.due_date >= weekStart && i.due_date <= todayStr(7)).slice(0, 3).map((i) => i.id)))
  }, [team, weekStart])

  useEffect(() => { load() }, [load])

  const weekPlanned = useMemo(() => analytics?.planned.reduce((s, p) => s + p.minutes, 0) ?? 0, [analytics])

  const toggleFocus = (id: string) => setFocusIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else if (n.size < 3) n.add(id); return n })

  const saveObjectives = async () => {
    setBusy(true)
    try {
      const friday = todayStr(4 - ((new Date().getDay() + 6) % 7))
      for (const id of focusIds) {
        await api(`/issues/${id}`, { method: 'PATCH', body: { dueDate: friday } })
      }
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  const totalLogged = analytics?.byDay.reduce((s, r) => s + r.minutes, 0) ?? 0

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto px-4 py-8 app-scroll">
      <div className="flex gap-2">
        {(['plan', 'review'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams({ tab: t })}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-bold transition ${tab === t ? 'bg-[#0A0A1C] text-white' : 'bg-indigo-500/15 text-slate-500 hover:bg-indigo-500/15'}`}
          >
            {t === 'plan' ? 'Weekly planning' : 'Weekly review'}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="mt-6" data-testid="weekly-plan">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">What are this week's objectives?</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Pick up to 3 issues as your weekly focus — they get a Friday due date.</p>
          <div className="mt-5 space-y-2">
            {openIssues.map((i) => {
              const on = focusIds.has(i.id)
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggleFocus(i.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${on ? 'border-[#7C5CFC] bg-indigo-500/10' : 'border-white/10 bg-[#101024] hover:border-white/20'}`}
                >
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${on ? 'border-[#7C5CFC] bg-[#7C5CFC] text-white' : 'border-white/20'}`}>{on ? '✓' : ''}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-200">{i.title}</span>
                  {on && <span className="rounded bg-[#7C5CFC]/10 px-2 py-0.5 text-[11px] font-bold text-[#A5B4FC]">this week</span>}
                </button>
              )
            })}
          </div>
          <button type="button" disabled={busy || focusIds.size === 0} onClick={saveObjectives} className="btn-orange mt-6 h-11 px-7 disabled:cursor-not-allowed disabled:bg-indigo-500/15 disabled:text-slate-600 disabled:shadow-none">
            {busy ? 'Saving…' : saved ? 'Objectives saved ✓' : 'Save weekly objectives'}
          </button>
        </div>
      )}

      {tab === 'review' && analytics && (
        <div className="mt-6" data-testid="weekly-review">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Week in review</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Week of {weekStart} · {fmtMinutesLong(totalLogged)} logged · {fmtMinutesLong(weekPlanned)} still planned</p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#101024] p-5">
            <h2 className="text-[13px] font-bold text-slate-200">Completed this week ({analytics.completed.length})</h2>
            <div className="mt-3 space-y-1.5">
              {analytics.completed.map((c) => (
                <p key={c.id} className="flex items-center gap-2 text-[13.5px] text-slate-400">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5FC48F] text-[9px] text-white">✓</span>
                  <span className="font-medium text-slate-200">{c.title}</span>
                  {c.project_name && <span className="rounded px-1.5 py-px text-[10.5px] font-bold" style={{ background: `${c.project_color}1A`, color: c.project_color ?? '#8A8AB0' }}>{c.project_name}</span>}
                </p>
              ))}
              {analytics.completed.length === 0 && <p className="text-[13px] text-slate-600">Nothing completed yet this week.</p>}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#101024] p-5">
            <h2 className="text-[13px] font-bold text-slate-200">Highlights</h2>
            <div className="mt-3 space-y-2">
              {analytics.highlights.map((h) => (
                <p key={h.id} className="rounded-lg bg-[#101024]/[0.03] px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-300">
                  <span className="font-bold">{h.user_name}</span> <span className="text-slate-600">· {h.date}</span><br />{h.body}
                </p>
              ))}
              {analytics.highlights.length === 0 && <p className="text-[13px] text-slate-600">No highlights saved this week yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

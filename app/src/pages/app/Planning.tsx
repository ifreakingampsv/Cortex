import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, fmtMinutesLong, minToTime, todayStr } from '../../lib/util'
import type { Issue } from '../../lib/types'

/** Guided daily-planning ritual: pick → timebox preview → confirm. */
export default function Planning() {
  const { team } = useWorkspace()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<Issue[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [capacity, setCapacity] = useState(300)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [existing, setExisting] = useState<Issue[]>([])

  const load = useCallback(async () => {
    if (!team) return
    const today = todayStr(0)
    const [open, todays] = await Promise.all([
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&completed=0`),
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&scheduledFrom=${today}&scheduledTo=${today}`),
    ])
    const todayIds = new Set(todays.issues.map((t) => t.id))
    setCandidates(open.issues.filter((i) => !i.scheduled_date || i.scheduled_date > today || todayIds.has(i.scheduled_date) === false).filter((i) => !todayIds.has(i.id)))
    setExisting(todays.issues)
  }, [team])

  useEffect(() => { load() }, [load])

  const alreadyPlanned = existing.reduce((s, i) => s + (i.completed_at ? 0 : (i.duration_minutes || i.estimate_minutes)), 0)
  const pickedList = useMemo(() => candidates.filter((c) => picked.has(c.id)), [candidates, picked])
  const pickedMin = pickedList.reduce((s, i) => s + (i.estimate_minutes || 60), 0)
  const totalMin = alreadyPlanned + pickedMin
  const over = totalMin > capacity

  /** Sequential timebox preview starting after existing planned work. */
  const preview = useMemo(() => {
    let cursor = 9 * 60
    const existingBlocks = existing
      .filter((i) => i.start_time && !i.completed_at)
      .map((i) => ({ start: Number(i.start_time!.slice(0, 2)) * 60 + Number(i.start_time!.slice(3)), dur: i.duration_minutes || i.estimate_minutes || 60 }))
    for (const b of existingBlocks.sort((a, b2) => a.start - b2.start)) {
      if (b.start + b.dur > cursor) cursor = b.start + b.dur
    }
    return pickedList.map((i) => {
      const dur = i.estimate_minutes || 60
      const start = cursor
      cursor += dur
      return { issue: i, start, dur }
    })
  }, [pickedList, existing])

  const confirm = async () => {
    setBusy(true)
    try {
      for (const p of preview) {
        await api(`/issues/${p.issue.id}/schedule`, {
          method: 'POST',
          body: { scheduledDate: todayStr(0), startTime: minToTime(p.start), durationMinutes: p.dur },
        })
      }
      navigate('/app')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto px-4 py-8 app-scroll">
      {/* steps header */}
      <div className="flex items-center gap-2">
        {['Pick your work', 'Balance the day', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${step > i ? 'bg-[#F2742D] text-white' : 'bg-stone-200 text-stone-500'}`}>{i + 1}</span>
            <span className={`text-[13px] font-semibold ${step > i ? 'text-stone-800' : 'text-stone-400'}`}>{s}</span>
            {i < 2 && <span className="mx-1 h-px w-8 bg-stone-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6" data-testid="planning-step-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">What do you want to get done today?</h1>
          <p className="mt-1 text-[13.5px] text-stone-500">You already have {fmtMinutesLong(alreadyPlanned)} planned. Pull in work from your backlog and other days.</p>
          <div className="mt-5 space-y-2">
            {candidates.map((c) => {
              const on = picked.has(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`plan-candidate-${c.id}`}
                  onClick={() => setPicked((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n })}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    on ? 'border-[#F2742D] bg-orange-50/70' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className={`flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${on ? 'border-[#F2742D] bg-[#F2742D] text-white' : 'border-stone-300'}`}>{on ? '✓' : ''}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-stone-800">{c.title}</span>
                    <span className="block text-[12px] text-stone-400">
                      {c.project_name ?? 'No project'}{c.labels.length ? ` · ${c.labels.map((l) => `#${l.name}`).join(' ')}` : ''}
                    </span>
                  </span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[12px] font-bold text-stone-500">{fmtMinutes(c.estimate_minutes || 60)}</span>
                </button>
              )
            })}
            {candidates.length === 0 && <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">Nothing available — everything is already scheduled or done. 🎉</p>}
          </div>
          <button type="button" disabled={picked.size === 0} onClick={() => setStep(2)} className="btn-orange mt-6 h-11 px-7 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
            Next: balance the day →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6" data-testid="planning-step-2">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Balance your day</h1>
          <p className="mt-1 text-[13.5px] text-stone-500">Set a realistic cap for today. Cortex timeboxes each task in sequence.</p>
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between text-[13px] font-semibold text-stone-600">
              <span>Daily workload</span>
              <span className={over ? 'text-red-500' : 'text-[#22A55C]'}>{fmtMinutesLong(totalMin)} / {fmtMinutesLong(capacity)}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (totalMin / capacity) * 100)}%`, background: over ? '#EF4444' : '#F0A742' }} />
            </div>
            <input type="range" min={60} max={600} step={30} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="mt-4 w-full accent-[#F2742D]" />
            <p className="text-center text-[12px] text-stone-400">Capacity: {fmtMinutesLong(capacity)}</p>
            {over && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                That's over capacity — your past self says hi. Untick something or raise the cap.
              </p>
            )}
            <div className="mt-4 space-y-1.5">
              {existing.filter((i) => !i.completed_at).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-[13px] text-stone-500">
                  <span className="truncate">Already planned: {i.title}</span>
                  <span className="ml-2 shrink-0 font-semibold">{i.start_time ?? ''} · {fmtMinutes(i.duration_minutes || i.estimate_minutes)}</span>
                </div>
              ))}
              {preview.map((p) => (
                <div key={p.issue.id} className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-[13px]">
                  <span className="truncate font-semibold text-stone-700">{p.issue.title}</span>
                  <span className="ml-2 shrink-0 font-bold text-[#EA6A2C]">{minToTime(p.start)} · {fmtMinutes(p.dur)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="h-11 rounded-full border border-stone-300 px-6 text-[14px] font-semibold text-stone-600 hover:bg-stone-50">← Back</button>
            <button type="button" onClick={() => setStep(3)} className="btn-orange h-11 px-7">Next: confirm →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6" data-testid="planning-step-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Ready for a clear day</h1>
          <p className="mt-1 text-[13.5px] text-stone-500">
            {preview.length} task{preview.length === 1 ? '' : 's'} will be timeboxed onto today's calendar ({fmtMinutesLong(totalMin)} total).
          </p>
          <div className="mt-5 space-y-2">
            {preview.map((p) => (
              <div key={p.issue.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                <span className="rounded-md bg-[#F2742D] px-2 py-1 text-[11px] font-bold text-white">{minToTime(p.start)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-stone-800">{p.issue.title}</span>
                <span className="text-[12px] font-bold text-stone-500">{fmtMinutes(p.dur)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="h-11 rounded-full border border-stone-300 px-6 text-[14px] font-semibold text-stone-600 hover:bg-stone-50">← Back</button>
            <button type="button" disabled={busy} onClick={confirm} data-testid="confirm-plan" className="btn-orange h-11 px-7 disabled:opacity-60">
              {busy ? 'Scheduling…' : 'Plan my day ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

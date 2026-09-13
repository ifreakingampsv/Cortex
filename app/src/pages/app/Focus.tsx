import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, todayStr } from '../../lib/util'
import type { Issue } from '../../lib/types'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export default function Focus() {
  const { team, statuses } = useWorkspace()
  const [candidates, setCandidates] = useState<Issue[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [elapsedFocus, setElapsedFocus] = useState(0) // focus seconds accrued this session
  const [sessionsDone, setSessionsDone] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!team) return
    const today = todayStr(0)
    const [scheduled, wip] = await Promise.all([
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&scheduledFrom=${today}&scheduledTo=${today}&completed=0`),
      api<{ issues: Issue[] }>(`/issues?teamId=${team.id}&completed=0`),
    ])
    const merged = [...scheduled.issues, ...wip.issues.filter((w) => !scheduled.issues.some((s) => s.id === w.id))]
    setCandidates(merged)
    setSelectedId((cur) => cur || merged[0]?.id || '')
  }, [team])

  useEffect(() => { load() }, [load])

  const selected = useMemo(() => candidates.find((c) => c.id === selectedId), [candidates, selectedId])
  const total = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // timer finished
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const finishTimer = useCallback(async (logIt: boolean) => {
    setRunning(false)
    if (mode === 'focus') {
      const rawSeconds = total - secondsLeft
      // An explicit "End & log" always records at least a minute; an auto-finished
      // session that somehow has nothing on the clock is skipped.
      const elapsed = logIt ? Math.max(1, Math.round(rawSeconds / 60)) : Math.round(rawSeconds / 60)
      setElapsedFocus((e) => e + rawSeconds)
      if (logIt && selected && elapsed > 0) {
        const { issueTotalMinutes } = await api<{ issueTotalMinutes: number }>(`/issues/${selected.id}/time-entries`, {
          method: 'POST', body: { minutes: elapsed, source: 'focus' },
        })
        setSessionsDone((n) => n + 1)
        setMessage(rawSeconds < 60
          ? `Session under a minute — logged 1m minimum on “${selected.title}” (${fmtMinutes(issueTotalMinutes)} total).`
          : `Logged ${elapsed}m on “${selected.title}” — ${fmtMinutes(issueTotalMinutes)} total.`)
      } else {
        setMessage(null)
      }
      setMode('break')
      setSecondsLeft(BREAK_SECONDS)
    } else {
      setMode('focus')
      setSecondsLeft(FOCUS_SECONDS)
      setMessage('Break over — back in focus.')
    }
  }, [mode, secondsLeft, selected, total])

  // react to hitting zero
  useEffect(() => {
    if (secondsLeft === 0 && !running) finishTimer(true)
  }, [secondsLeft, running, finishTimer])

  const completeTask = async () => {
    if (!selected) return
    const mins = Math.max(1, Math.round(elapsedFocus / 60))
    if (mins > 0) {
      await api(`/issues/${selected.id}/time-entries`, { method: 'POST', body: { minutes: mins, source: 'focus' } })
    }
    const doneStatus = statuses.find((s) => s.category === 'completed')
    if (doneStatus) await api(`/issues/${selected.id}`, { method: 'PATCH', body: { statusId: doneStatus.id } })
    setMessage(`“${selected.title}” completed with ${fmtMinutes(mins)} logged.`)
    setElapsedFocus(0)
    setSelectedId('')
    load()
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = 1 - secondsLeft / total

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-4 py-8 app-scroll">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold tracking-tight text-stone-900">Focus mode</h1>
        <p className="mt-1 text-center text-[13.5px] text-stone-500">Work in 25-minute pomodoro sprints. Finished sessions are logged as time entries.</p>

        <div className="mt-6">
          <label className="text-[11px] font-bold tracking-wide text-stone-400">WORKING ON</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            data-testid="focus-task-select"
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[14px] font-semibold text-stone-800 outline-none focus:border-[#F2742D]"
          >
            <option value="">Select a task…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.title}{c.project_name ? ` · ${c.project_name}` : ''}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 rounded-3xl bg-stone-900 px-8 py-10 text-center shadow-2xl" data-testid="focus-timer">
          <p className={`text-[11px] font-bold tracking-[0.2em] ${mode === 'focus' ? 'text-[#F6A03C]' : 'text-[#5FC48F]'}`}>
            {mode === 'focus' ? 'FOCUS' : 'BREAK'}
          </p>
          <p className="mt-2 font-mono text-[64px] font-bold leading-none text-white tabular-nums" data-testid="timer-display">
            {mm}:{ss}
          </p>
          <div className="mx-auto mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-stone-700">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct * 100}%`, background: mode === 'focus' ? '#F2742D' : '#5FC48F' }} />
          </div>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              data-testid="timer-toggle"
              className="btn-orange h-11 px-8 text-[15px]"
            >
              {running ? 'Pause' : secondsLeft === total ? 'Start' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={() => { setRunning(false); setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS) }}
              className="h-11 rounded-full border border-stone-600 px-5 text-[14px] font-semibold text-stone-300 transition hover:bg-stone-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => { setRunning(false); finishTimer(true) }}
              className="h-11 rounded-full border border-stone-600 px-5 text-[14px] font-semibold text-stone-300 transition hover:bg-stone-800"
            >
              End &amp; log
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
          <div className="text-[13px] text-stone-600">
            <p><span className="font-bold text-stone-800">{sessionsDone}</span> sessions logged</p>
            <p className="text-stone-400">{fmtMinutes(Math.round(elapsedFocus / 60))} focus time this visit</p>
          </div>
          <button type="button" disabled={!selected} onClick={completeTask} className="btn-orange h-10 px-5 text-[14px] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
            Complete task
          </button>
        </div>

        {message && (
          <p data-testid="focus-message" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center text-[13.5px] font-semibold text-green-700">{message}</p>
        )}
      </div>
    </div>
  )
}

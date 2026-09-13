import { useState } from 'react'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, fmtTime12 } from '../../lib/util'
import type { Issue } from '../../lib/types'

const DRAG_TYPE = 'application/x-cortex-issue'

export function setIssueDrag(e: React.DragEvent, issue: Issue) {
  e.dataTransfer.setData(DRAG_TYPE, issue.id)
  e.dataTransfer.effectAllowed = 'move'
}

export function getIssueDrag(e: React.DragEvent): string | null {
  const raw = e.dataTransfer.getData(DRAG_TYPE)
  if (raw) return raw
  // Fallback for browsers that lowercase the MIME type
  for (const t of Array.from(e.dataTransfer.types)) {
    if (t.toLowerCase() === DRAG_TYPE) return e.dataTransfer.getData(t)
  }
  return null
}

export default function TaskCard({ issue, onToggleDone }: { issue: Issue; onToggleDone?: (i: Issue) => void }) {
  const { openTask, statuses } = useWorkspace()
  const [busy, setBusy] = useState(false)
  const done = Boolean(issue.completed_at)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (busy) return
    const target = done
      ? statuses.find((s) => s.category !== 'completed')
      : statuses.find((s) => s.category === 'completed')
    if (!target) return
    setBusy(true)
    try {
      await api(`/issues/${issue.id}`, { method: 'PATCH', body: { statusId: target.id } })
      onToggleDone?.(issue)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => setIssueDrag(e, issue)}
      onClick={() => openTask(issue.id)}
      data-testid="task-card"
      className={`group cursor-pointer rounded-lg border bg-[#101024] px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-md hover:border-white/20 ${
        done ? 'border-white/[0.07] bg-[#101024]/[0.03]' : 'border-white/10'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={done ? 'Mark as not done' : 'Mark done'}
          onClick={toggle}
          className={`mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition ${
            done ? 'border-[#5FC48F] bg-[#5FC48F]' : 'border-white/20 hover:border-[#5FC48F]'
          }`}
        >
          {done && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5.2 4.2 7.4 8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[13px] font-medium leading-snug text-slate-200 ${done ? 'line-through text-slate-600' : ''}`}>
              {issue.title}
            </p>
            <span className="shrink-0 rounded bg-[#101024]/10 px-1.5 py-px text-[10px] font-semibold text-slate-500">
              {fmtMinutes(issue.duration_minutes || issue.estimate_minutes)}
            </span>
          </div>
          {issue.subtasksTotal > 0 && (
            <p className="mt-0.5 text-[11px] text-slate-600">
              ☑ {issue.subtasksDone}/{issue.subtasksTotal} subtasks
            </p>
          )}
          {issue.start_time && (
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: issue.project_color ?? '#7CA6F0' }} />
              {fmtTime12(issue.start_time)}{issue.duration_minutes ? ` – ${fmtMinutes(issue.duration_minutes)}` : ''}
            </p>
          )}
          {(issue.labels.length > 0 || issue.project_name) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {issue.labels.map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: l.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                  #{l.name}
                </span>
              ))}
              {issue.commentCount > 0 && <span className="text-[10.5px] text-slate-600">💬 {issue.commentCount}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

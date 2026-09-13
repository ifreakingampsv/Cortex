import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, initials, relTime } from '../../lib/util'
import type { Activity, Comment, Issue, IssueDetail, TimeEntry } from '../../lib/types'

/**
 * Global task detail modal. Rendered inside AppShell; opened via workspace.openTask(id).
 */
export default function TaskModal() {
  const { editingTaskId, closeTask, taskCounter, statuses, members, projects, labels } = useWorkspace()
  const open = Boolean(editingTaskId)

  const [detail, setDetail] = useState<IssueDetail | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [commentText, setCommentText] = useState('')
  const [subtaskText, setSubtaskText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const loadedIdRef = useRef<string | null>(null)

  const load = useCallback(async (id: string) => {
    const d = await api<IssueDetail>(`/issues/${id}`)
    setDetail(d)
    setTitle(d.issue.title)
    setDescription(d.issue.description)
  }, [])

  useEffect(() => {
    if (!editingTaskId) return
    loadedIdRef.current = null
    load(editingTaskId).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [editingTaskId, taskCounter, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTask() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeTask])

  if (!open || !editingTaskId) return null

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    try {
      const { issue } = await api<{ issue: Issue }>(`/issues/${editingTaskId}`, { method: 'PATCH', body })
      setDetail((d) => (d ? { ...d, issue } : d))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const commitTitle = () => {
    if (detail && title.trim() && title !== detail.issue.title) patch({ title })
  }
  const commitDescription = () => {
    if (detail && description !== detail.issue.description) patch({ description })
  }

  const addComment = async () => {
    if (!commentText.trim()) return
    try {
      const { comment } = await api<{ comment: Comment }>(`/issues/${editingTaskId}/comments`, { method: 'POST', body: { body: commentText } })
      setDetail((d) => (d ? { ...d, comments: [...d.comments, comment] } : d))
      setDetail((d) => (d ? { ...d, issue: { ...d.issue, commentCount: d.issue.commentCount + 1 } } : d))
      setCommentText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to comment')
    }
  }

  const addSubtask = async () => {
    if (!subtaskText.trim()) return
    try {
      const { subtask } = await api<{ subtask: Issue }>(`/issues/${editingTaskId}/subtasks`, { method: 'POST', body: { title: subtaskText } })
      setDetail((d) => (d ? { ...d, subtasks: [...d.subtasks, subtask] } : d))
      setSubtaskText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add subtask')
    }
  }

  const toggleSubtask = async (st: Issue) => {
    const target = st.completed_at
      ? statuses.find((s) => s.category !== 'completed')
      : statuses.find((s) => s.category === 'completed')
    if (!target) return
    await api(`/issues/${st.id}`, { method: 'PATCH', body: { statusId: target.id } })
    await load(editingTaskId)
  }

  const toggleLabel = async (labelId: string) => {
    if (!detail) return
    const has = detail.issue.labels.some((l) => l.id === labelId)
    if (has) {
      await api(`/issues/${editingTaskId}/labels/${labelId}`, { method: 'DELETE' })
    } else {
      await api(`/issues/${editingTaskId}/labels`, { method: 'POST', body: { labelId } })
    }
    await load(editingTaskId)
  }

  const schedule = async (scheduledDate: string) => {
    if (!scheduledDate) {
      await api(`/issues/${editingTaskId}/unschedule`, { method: 'POST' })
    } else {
      await api(`/issues/${editingTaskId}/schedule`, { method: 'POST', body: { scheduledDate, startTime: detail?.issue.start_time ?? undefined, durationMinutes: detail?.issue.duration_minutes ?? detail?.issue.estimate_minutes ?? 60 } })
    }
    await load(editingTaskId)
  }

  const remove = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    await api(`/issues/${editingTaskId}`, { method: 'DELETE' })
    closeTask()
  }

  const issue = detail?.issue
  const done = Boolean(issue?.completed_at)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#04040A]/70 p-4 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) closeTask() }}>
      <div
        data-testid="task-modal"
        className="my-6 w-full max-w-2xl rounded-2xl bg-[#101024] shadow-2xl"
        style={{ animation: 'reveal .18s ease-out both' }}
      >
        {!issue ? (
          <div className="flex h-48 items-center justify-center text-slate-600">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#7C5CFC]" />
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-4">
              <div className="min-w-0 flex-1">
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTitle(); titleRef.current?.blur() } }}
                  className="w-full bg-transparent text-lg font-bold text-slate-100 outline-none"
                />
                <p className="mt-0.5 text-xs text-slate-600">
                  {issue.project_name ? `${issue.project_name} · ` : ''}created {relTime(issue.created_at)}
                  {saving && <span className="ml-2 text-[#A5B4FC]">saving…</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={remove} className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-500">Delete</button>
                <button type="button" onClick={closeTask} aria-label="Close" className="rounded-md px-2 py-1.5 text-slate-600 transition hover:bg-[#101024]/10 hover:text-slate-300">✕</button>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-5 md:grid-cols-[1fr_230px]">
              {/* left: description, subtasks, comments, activity */}
              <div className="min-w-0">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={commitDescription}
                  placeholder="Add a description…"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 px-3 py-2 text-[13.5px] text-slate-300 outline-none transition focus:border-[#7C5CFC]"
                />

                <h4 className="mt-5 text-[13px] font-bold text-slate-200">
                  Subtasks {detail!.subtasks.length > 0 && <span className="font-medium text-slate-600">{detail!.subtasks.filter((s) => s.completed_at).length}/{detail!.subtasks.length}</span>}
                </h4>
                <div className="mt-2 space-y-1.5">
                  {detail!.subtasks.map((st) => (
                    <label key={st.id} className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-[#101024]/[0.04] px-3 py-2">
                      <input type="checkbox" checked={Boolean(st.completed_at)} onChange={() => toggleSubtask(st)} className="h-3.5 w-3.5 accent-[#7C5CFC]" />
                      <span className={`text-[13px] ${st.completed_at ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{st.title}</span>
                    </label>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={subtaskText}
                      onChange={(e) => setSubtaskText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                      placeholder="+ Add subtask, press Enter"
                      className="min-w-0 flex-1 rounded-lg border border-dashed border-white/20 px-3 py-2 text-[13px] outline-none transition focus:border-[#7C5CFC]"
                    />
                  </div>
                </div>

                <h4 className="mt-6 text-[13px] font-bold text-slate-200">Comments</h4>
                <div className="mt-2 space-y-3">
                  {detail!.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: c.author_color ?? '#62628A' }}>
                        {c.author_name ? initials(c.author_name) : '?'}
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg bg-[#101024]/[0.03] px-3 py-2">
                        <p className="text-[12px]">
                          <span className="font-bold text-slate-200">{c.author_name ?? 'Unknown'}</span>
                          <span className="ml-2 text-slate-600">{relTime(c.created_at)}</span>
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">{c.body}</p>
                      </div>
                    </div>
                  ))}
                  {detail!.comments.length === 0 && <p className="text-[13px] text-slate-600">No comments yet.</p>}
                  <div className="flex gap-2.5">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComment() } }}
                      placeholder="Write a comment…"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 px-3 py-2 text-[13px] outline-none transition focus:border-[#7C5CFC]"
                    />
                    <button type="button" onClick={addComment} className="btn-orange h-9 px-4 text-[13px]">Send</button>
                  </div>
                </div>

                <h4 className="mt-6 text-[13px] font-bold text-slate-200">Activity</h4>
                <div className="mt-2 space-y-1.5">
                  {detail!.activity.map((a: Activity) => (
                    <p key={a.id} className="text-[12px] text-slate-500">
                      <span className="font-semibold text-slate-300">{a.actor_name ?? 'Someone'}</span> {describeActivity(a)}
                      <span className="ml-1.5 text-slate-600">{relTime(a.created_at)}</span>
                    </p>
                  ))}
                </div>

                {detail!.timeEntries.length > 0 && (
                  <>
                    <h4 className="mt-6 text-[13px] font-bold text-slate-200">Time logged</h4>
                    <div className="mt-2 space-y-1">
                      {detail!.timeEntries.map((t: TimeEntry) => (
                        <p key={t.id} className="text-[12px] text-slate-500">
                          <span className="font-semibold text-slate-300">{t.user_name ?? 'Someone'}</span> logged {fmtMinutes(t.minutes)} · {t.logged_date} <span className="text-slate-600">({t.source})</span>
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* right: fields */}
              <div className="space-y-4">
                <Field label="Status">
                  <select
                    value={issue.status_id}
                    onChange={(e) => patch({ statusId: e.target.value })}
                    data-testid="status-select"
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  >
                    {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Assignee">
                  <select
                    value={issue.assignee_id ?? ''}
                    onChange={(e) => patch({ assigneeId: e.target.value || null })}
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="Project">
                  <select
                    value={issue.project_id ?? ''}
                    onChange={(e) => patch({ projectId: e.target.value || null })}
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Estimate">
                  <input
                    type="number"
                    min={0}
                    step={15}
                    defaultValue={issue.estimate_minutes}
                    onBlur={(e) => { const v = Number(e.target.value); if (v !== issue.estimate_minutes) patch({ estimateMinutes: v }) }}
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  />
                </Field>
                <Field label="Scheduled">
                  <input
                    type="date"
                    value={issue.scheduled_date ?? ''}
                    onChange={(e) => schedule(e.target.value)}
                    data-testid="schedule-input"
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  />
                </Field>
                {issue.scheduled_date && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Start">
                      <input
                        type="time"
                        value={issue.start_time ?? ''}
                        onChange={(e) => api(`/issues/${issue.id}/schedule`, { method: 'POST', body: { scheduledDate: issue.scheduled_date, startTime: e.target.value || undefined, durationMinutes: issue.duration_minutes ?? issue.estimate_minutes ?? 60 } }).then(() => load(issue.id))}
                        className="w-full rounded-lg border border-white/10 px-2 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                      />
                    </Field>
                    <Field label="Duration (min)">
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={issue.duration_minutes ?? issue.estimate_minutes ?? 60}
                        onChange={(e) => api(`/issues/${issue.id}/schedule`, { method: 'POST', body: { scheduledDate: issue.scheduled_date, startTime: issue.start_time ?? undefined, durationMinutes: Number(e.target.value) } }).then(() => load(issue.id))}
                        className="w-full rounded-lg border border-white/10 px-2 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                      />
                    </Field>
                  </div>
                )}
                <Field label="Due date">
                  <input
                    type="date"
                    value={issue.due_date ?? ''}
                    onChange={(e) => patch({ dueDate: e.target.value || null })}
                    className="w-full rounded-lg border border-white/10 px-2.5 py-2 text-[13px] outline-none focus:border-[#7C5CFC]"
                  />
                </Field>
                <Field label="Labels">
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((l) => {
                      const has = issue.labels.some((il) => il.id === l.id)
                      return (
                        <button
                          key={l.id}
                          type="button"
                          data-testid={`label-${l.name}`}
                          onClick={() => toggleLabel(l.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition ${
                            has ? 'border-transparent text-white' : 'border-white/10 bg-[#101024] text-slate-500 hover:border-white/20'
                          }`}
                          style={has ? { background: l.color } : undefined}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: has ? '#fff' : l.color }} />
                          {l.name}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                {done && (
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-[12px] font-semibold text-green-700">
                    ✓ Completed {issue.completed_at ? relTime(issue.completed_at) : ''}
                  </div>
                )}
              </div>
            </div>
            {error && <p className="mx-6 mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold tracking-wide text-slate-600">{label.toUpperCase()}</p>
      {children}
    </div>
  )
}

function describeActivity(a: Activity): string {
  const p = (() => { try { return JSON.parse(a.payload) as Record<string, string> } catch { return {} } })()
  switch (a.type) {
    case 'issue.created': return 'created this task'
    case 'issue.status_changed': return `moved status ${p.from} → ${p.to}`
    case 'issue.completed': return 'completed this task'
    case 'issue.renamed': return `renamed from "${p.from}" to "${p.to}"`
    case 'issue.scheduled': return `scheduled this for ${p.date}${p.startTime ? ` at ${p.startTime}` : ''}`
    case 'issue.unscheduled': return 'unscheduled this task'
    case 'issue.deleted': return 'deleted a task'
    case 'comment.added': return 'commented'
    case 'member.added': return `invited ${p.email}`
    default: return a.type
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import TaskCard, { getIssueDrag } from '../../components/app/TaskCard'
import type { Issue } from '../../lib/types'

export default function Board() {
  const { team, statuses, projects } = useWorkspace()
  const [params] = useSearchParams()
  const projectFilter = params.get('project') ?? ''
  const [issues, setIssues] = useState<Issue[]>([])
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ teamId: team.id })
      if (projectFilter) q.set('projectId', projectFilter)
      const { issues: list } = await api<{ issues: Issue[] }>(`/issues?${q}`)
      setIssues(list)
    } finally {
      setLoading(false)
    }
  }, [team, projectFilter])

  useEffect(() => { load() }, [load])

  const byStatus = useMemo(() => {
    const map = new Map<string, Issue[]>()
    statuses.forEach((s) => map.set(s.id, []))
    for (const i of issues) map.get(i.status_id)?.push(i)
    return map
  }, [issues, statuses])

  const move = async (issueId: string, statusId: string) => {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status_id: statusId } : i)))
    await api(`/issues/${issueId}`, { method: 'PATCH', body: { statusId } })
    load()
  }

  const project = projects.find((p) => p.id === projectFilter)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101024]/60 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Link to="/app" className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition hover:bg-[#101024]/10">☰ Today</Link>
          <span className="rounded-md bg-indigo-500/15 px-3 py-1.5 text-[13px] font-bold text-slate-200">⊞ Board</span>
          <h1 className="ml-2 text-[15px] font-bold text-slate-200">
            {project ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: project.color }} />
                {project.name}
              </span>
            ) : 'All work'}
          </h1>
        </div>
        <p className="text-[12px] text-slate-600">{issues.length} issues · drag cards between columns</p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 app-scroll">
        {loading && (
          <div className="flex w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#7C5CFC]" />
          </div>
        )}
        {statuses.map((s, ci) => {
          const list = byStatus.get(s.id) ?? []
          return (
            <div
              key={s.id}
              data-testid={`board-column-${ci}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s.id) }}
              onDragLeave={() => setDragOver((d) => (d === s.id ? null : d))}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                const id = getIssueDrag(e)
                if (id) move(id, s.id)
              }}
              className={`flex w-[272px] shrink-0 flex-col rounded-xl border p-3 transition ${
                dragOver === s.id ? 'border-[#7C5CFC] bg-indigo-500/10' : 'border-white/10 bg-[#101024]/[0.03]'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="flex items-center gap-2 text-[13px] font-bold text-slate-200">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.category === 'completed' ? '#22C55E' : s.category === 'started' ? '#F0A742' : s.category === 'backlog' ? '#62628A' : '#7CA6F0' }}
                  />
                  {s.name}
                </p>
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-bold text-slate-500">{list.length}</span>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto app-scroll">
                {list.map((i) => <TaskCard key={i.id} issue={i} onToggleDone={load} />)}
                {list.length === 0 && <p className="pt-3 text-center text-[12px] text-slate-700">Drop tasks here</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

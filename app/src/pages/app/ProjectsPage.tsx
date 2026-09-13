import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'

const COLORS = ['#F2742D', '#8B5CF6', '#3B82F6', '#EC4899', '#22C55E', '#F59E0B', '#EF4444', '#14B8A6']

export default function ProjectsPage() {
  const { team, projects, role, reloadMeta } = useWorkspace()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const isAdmin = role === 'admin'

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await api(`/teams/${team!.id}/projects`, { method: 'POST', body: { name: name.trim(), color, description } })
      setName('')
      setDescription('')
      await reloadMeta()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this project? Its issues become project-less (they are not deleted).')) return
    try {
      await api(`/projects/${id}`, { method: 'DELETE' })
      await reloadMeta()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  const toggleArchive = async (p: { id: string; archived: number }) => {
    await api(`/projects/${p.id}`, { method: 'PATCH', body: { archived: p.archived ? 0 : 1 } })
    await reloadMeta()
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8 app-scroll">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Projects</h1>
        <p className="mt-1 text-[13.5px] text-stone-500">Organize issues into projects. Click a project to open it on the board.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} data-testid={`project-${p.name}`} className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <Link to={`/app/board?project=${p.id}`} className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-[4px]" style={{ background: p.color }} />
                  <span className="text-[15.5px] font-bold text-stone-900 hover:text-[#EA6A2C]">{p.name}</span>
                </Link>
                {p.archived ? <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10.5px] font-bold text-stone-400">Archived</span> : null}
              </div>
              <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[12.5px] leading-snug text-stone-500">{p.description || 'No description'}</p>
              <div className="mt-3 flex items-center gap-4 text-[12.5px] font-semibold">
                <span className="text-stone-600">{p.openIssues ?? 0} open</span>
                <span className="text-[#22A55C]">{p.doneIssues ?? 0} done</span>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
                <Link to={`/app/board?project=${p.id}`} className="rounded-md bg-stone-100/80 px-3 py-1.5 text-[12.5px] font-bold text-stone-600 transition hover:bg-stone-200/70">Open board</Link>
                <button type="button" onClick={() => toggleArchive(p)} className="rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-stone-400 transition hover:bg-stone-100 hover:text-stone-600">
                  {p.archived ? 'Unarchive' : 'Archive'}
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => remove(p.id)} className="ml-auto rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-stone-400 transition hover:bg-red-50 hover:text-red-500">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-[13px] font-bold text-stone-800">New project</h2>
          <div className="mt-3 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              data-testid="project-name"
              className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#F2742D]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-stone-200 px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#F2742D]"
            />
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`color ${c}`}
                  className={`h-7 w-7 rounded-lg transition ${color === c ? 'ring-2 ring-stone-800 ring-offset-2' : 'opacity-80 hover:opacity-100'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button type="button" disabled={!name.trim() || busy} onClick={create} data-testid="project-create" className="btn-orange h-10 px-6 text-[14px] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
              {busy ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

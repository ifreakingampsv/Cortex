import { useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useWorkspace } from '../../lib/workspace'
import { AVATAR_COLORS, initials } from '../../lib/util'

const STATUS_CATEGORIES = ['backlog', 'unstarted', 'started', 'completed'] as const
const LABEL_COLORS = ['#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#22C55E', '#F2742D']

export default function Settings() {
  const { user, refresh } = useAuth()
  const { team, statuses, labels, role, reloadMeta, setTeamId } = useWorkspace()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? '#F2742D')
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  const [statusName, setStatusName] = useState('')
  const [statusCategory, setStatusCategory] = useState<(typeof STATUS_CATEGORIES)[number]>('unstarted')
  const [labelName, setLabelName] = useState('')
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0])
  const [teamName, setTeamName] = useState(team?.name ?? '')
  const [teamMsg, setTeamMsg] = useState<string | null>(null)
  const isAdmin = role === 'admin'

  const saveProfile = async () => {
    if (!name.trim()) return
    await api('/users/me', { method: 'PATCH', body: { name: name.trim(), avatarColor } })
    await refresh()
    setProfileMsg('Profile saved ✓')
  }

  const addStatus = async () => {
    if (!statusName.trim()) return
    try {
      await api(`/teams/${team!.id}/statuses`, { method: 'POST', body: { name: statusName.trim(), category: statusCategory } })
      setStatusName('')
      await reloadMeta()
    } catch (e) {
      setTeamMsg(e instanceof Error ? e.message : 'Failed')
    }
  }

  const renameStatus = async (id: string, newName: string) => {
    if (!newName.trim()) return
    await api(`/statuses/${id}`, { method: 'PATCH', body: { name: newName.trim() } })
    await reloadMeta()
  }

  const deleteStatus = async (id: string) => {
    if (!confirm('Delete this status? Only empty statuses can be deleted.')) return
    try {
      await api(`/statuses/${id}`, { method: 'DELETE' })
      await reloadMeta()
    } catch (e) {
      setTeamMsg(e instanceof Error ? e.message : 'Failed')
    }
  }

  const addLabel = async () => {
    if (!labelName.trim()) return
    try {
      await api(`/teams/${team!.id}/labels`, { method: 'POST', body: { name: labelName.trim(), color: labelColor } })
      setLabelName('')
      await reloadMeta()
    } catch (e) {
      setTeamMsg(e instanceof Error ? e.message : 'Failed')
    }
  }

  const deleteLabel = async (id: string) => {
    await api(`/labels/${id}`, { method: 'DELETE' })
    await reloadMeta()
  }

  const renameTeam = async () => {
    if (!teamName.trim() || teamName.trim() === team?.name) return
    await api(`/teams/${team!.id}`, { method: 'PATCH', body: { name: teamName.trim() } })
    await refresh()
    setTeamMsg('Workspace renamed ✓')
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8 app-scroll">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h1 className="text-lg font-bold text-stone-900">Profile</h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: avatarColor }}>
              {initials(name || 'U')}
            </span>
            <div className="flex-1">
              <label className="text-[11px] font-bold tracking-wide text-stone-400">NAME</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-[14px] outline-none focus:border-[#F2742D]"
              />
              <div className="mt-2 flex gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} type="button" aria-label={`avatar ${c}`} onClick={() => setAvatarColor(c)}
                    className={`h-6 w-6 rounded-full transition ${avatarColor === c ? 'ring-2 ring-stone-800 ring-offset-2' : 'hover:scale-110'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={saveProfile} className="btn-orange h-10 px-6 text-[14px]">Save profile</button>
            <p className="text-[12.5px] text-stone-400">{user?.email}</p>
          </div>
          {profileMsg && <p className="mt-2 text-[13px] font-semibold text-green-600">{profileMsg}</p>}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Workspace</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!isAdmin}
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[14px] outline-none focus:border-[#F2742D] disabled:bg-stone-50 disabled:text-stone-400"
            />
            <button type="button" onClick={renameTeam} disabled={!isAdmin} className="btn-orange h-10 px-5 text-[13.5px] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">Rename</button>
          </div>
          {teamMsg && <p className="mt-2 text-[13px] font-semibold text-green-600">{teamMsg}</p>}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Workflow statuses</h2>
          <p className="mt-0.5 text-[12.5px] text-stone-500">The kanban columns and status options every issue in this workspace can use.</p>
          <div className="mt-4 space-y-2">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-stone-100 bg-stone-50/60 px-3.5 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.category === 'completed' ? '#22C55E' : s.category === 'started' ? '#F0A742' : s.category === 'backlog' ? '#A8A29E' : '#7CA6F0' }} />
                <input
                  defaultValue={s.name}
                  onBlur={(e) => { if (e.target.value.trim() && e.target.value !== s.name && isAdmin) renameStatus(s.id, e.target.value) }}
                  disabled={!isAdmin}
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13.5px] font-semibold text-stone-800 outline-none hover:border-stone-200 focus:border-[#F2742D] focus:bg-white"
                />
                <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-stone-400 ring-1 ring-stone-200">{s.category}</span>
                {isAdmin && (
                  <button type="button" onClick={() => deleteStatus(s.id)} className="rounded px-1.5 text-stone-300 transition hover:text-red-500" title="Delete status">✕</button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={statusName}
                onChange={(e) => setStatusName(e.target.value)}
                placeholder="New status name"
                data-testid="status-name"
                className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#F2742D]"
              />
              <select value={statusCategory} onChange={(e) => setStatusCategory(e.target.value as typeof statusCategory)} className="rounded-lg border border-stone-200 px-2.5 py-2 text-[13px] outline-none">
                {STATUS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={addStatus} data-testid="status-add" className="btn-orange h-10 px-5 text-[13.5px]">Add status</button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Labels</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {labels.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold text-white" style={{ background: l.color }}>
                #{l.name}
                {isAdmin && (
                  <button type="button" onClick={() => deleteLabel(l.id)} className="ml-0.5 opacity-70 transition hover:opacity-100" title="Delete label">✕</button>
                )}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="New label"
              data-testid="label-name"
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#F2742D]"
            />
            <div className="flex gap-1.5">
              {LABEL_COLORS.map((c) => (
                <button key={c} type="button" aria-label={`label color ${c}`} onClick={() => setLabelColor(c)}
                  className={`h-6 w-6 rounded-full transition ${labelColor === c ? 'ring-2 ring-stone-800 ring-offset-2' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
            </div>
            <button type="button" onClick={addLabel} data-testid="label-add" className="btn-orange h-10 px-5 text-[13.5px]">Add label</button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Team switcher shortcut</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {useWorkspacesList().map((t) => (
              <button key={t.id} type="button" onClick={() => setTeamId(t.id)}
                className={`rounded-full border px-4 py-2 text-[13px] font-bold transition ${t.id === team?.id ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function useWorkspacesList() {
  const { teams } = useWorkspace()
  return teams
}

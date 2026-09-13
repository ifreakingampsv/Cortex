import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useWorkspace } from '../../lib/workspace'
import { initials } from '../../lib/util'
import { CortexMark } from '../Logo'

function Item({ to, label, icon, exact = false }: { to: string; label: string; icon: string; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition ${
          isActive ? 'bg-indigo-500/15 text-slate-100' : 'text-slate-400 hover:bg-[#101024]/10'
        }`
      }
    >
      <span className="w-4 text-center text-[13px]">{icon}</span>
      {label}
    </NavLink>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 mb-1 px-2.5 text-[10px] font-bold tracking-[0.12em] text-slate-600">{children}</p>
}

export default function Sidebar() {
  const { team, teams, setTeamId, role, projects } = useWorkspace()
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const { '*': rest } = useParams()
  void rest
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const createTeam = async () => {
    if (!newName.trim()) return
    const { team: t } = await api<{ team: { id: string } }>('/teams', { method: 'POST', body: { name: newName.trim() } })
    await refresh()
    setTeamId(t.id)
    setCreating(false)
    setNewName('')
    setSwitcherOpen(false)
    navigate('/app')
  }

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-white/10 bg-[#0E0E20]">
      {/* Workspace switcher */}
      <div ref={switcherRef} className="relative px-3 pt-3.5">
        <button
          type="button"
          onClick={() => setSwitcherOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#101024]/10"
        >
          <CortexMark size={22} />
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-slate-200">{team?.name ?? '…'}</span>
          <span className="text-[9px] text-slate-600">▼</span>
        </button>
        {switcherOpen && (
          <div className="absolute left-3 right-3 top-12 z-30 rounded-xl border border-white/10 bg-[#101024] p-1.5 shadow-xl">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTeamId(t.id); setSwitcherOpen(false) }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13.5px] transition hover:bg-[#101024]/10 ${t.id === team?.id ? 'font-bold text-slate-100' : 'text-slate-400'}`}
              >
                {t.name}
                {t.id === team?.id && <span className="text-[#7C5CFC]">✓</span>}
              </button>
            ))}
            <div className="my-1 h-px bg-[#101024]/10" />
            {creating ? (
              <div className="p-1.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createTeam(); if (e.key === 'Escape') setCreating(false) }}
                  placeholder="Workspace name"
                  className="w-full rounded-md border border-white/20 px-2 py-1.5 text-[13px] outline-none focus:border-[#7C5CFC]"
                />
                <div className="mt-1.5 flex gap-1.5">
                  <button type="button" onClick={createTeam} className="flex-1 rounded-md bg-[#7C5CFC] py-1 text-[12px] font-bold text-white hover:bg-[#6D4AE0]">Create</button>
                  <button type="button" onClick={() => setCreating(false)} className="flex-1 rounded-md border border-white/10 py-1 text-[12px] font-semibold text-slate-500">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)} className="w-full rounded-lg px-2.5 py-2 text-left text-[13.5px] font-semibold text-[#A5B4FC] transition hover:bg-indigo-500/10">
                + New workspace
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 app-scroll">
        <div className="mt-3 space-y-0.5">
          <Item to="/app" label="Home" icon="⌂" exact />
          <Item to="/app" label="Today" icon="☀" exact />
          <Item to="/app/focus" label="Focus" icon="◉" />
        </div>
        <GroupLabel>DAY</GroupLabel>
        <div className="space-y-0.5">
          <Item to="/app/planning" label="Daily planning" icon="✎" />
          <Item to="/app/shutdown" label="Daily shutdown" icon="☾" />
          <Item to="/app/analytics" label="Daily highlights" icon="★" />
        </div>
        <GroupLabel>WEEK</GroupLabel>
        <div className="space-y-0.5">
          <Item to="/app/weekly?tab=plan" label="Weekly planning" icon="▤" />
          <Item to="/app/weekly?tab=review" label="Weekly review" icon="↻" />
        </div>
        <GroupLabel>TEAM</GroupLabel>
        <div className="space-y-0.5">
          <Item to="/app/team" label="Members" icon="☰" />
          <Item to="/app/projects" label="Projects" icon="◧" />
          {projects.filter((p) => !p.archived).slice(0, 6).map((p) => (
            <NavLink
              key={p.id}
              to={`/app/board?project=${p.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[13px] transition ${
                  isActive ? 'bg-indigo-500/15 text-slate-100 font-medium' : 'text-slate-500 hover:bg-[#101024]/10'
                }`
              }
            >
              <span className="ml-[5px] h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 px-3 py-3">
        <NavLink to="/app/settings" className={({ isActive }) =>
          `mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition ${isActive ? 'bg-indigo-500/15 text-slate-100' : 'text-slate-400 hover:bg-[#101024]/10'}`}>
          <span className="w-4 text-center">⚙</span> Settings
        </NavLink>
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: user?.avatarColor ?? '#7C5CFC' }}>
            {user ? initials(user.name) : '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-200">{user?.name}</p>
            <p className="truncate text-[11px] text-slate-600">{role === 'admin' ? 'Admin' : 'Member'}</p>
          </div>
          <button
            type="button"
            title="Log out"
            onClick={() => { logout(); navigate('/') }}
            className="rounded-md px-1.5 py-1 text-slate-600 transition hover:bg-[#101024]/10 hover:text-slate-300"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { initials } from '../../lib/util'

export default function TeamPage() {
  const { team, members, role, reloadMeta } = useWorkspace()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const isAdmin = role === 'admin'

  const invite = async () => {
    if (!inviteEmail.includes('@')) return
    setBusy(true)
    setMsg(null)
    try {
      await api(`/teams/${team!.id}/members`, { method: 'POST', body: { email: inviteEmail.trim(), name: inviteName.trim() || undefined, role: inviteRole } })
      setMsg({ kind: 'ok', text: `Invited ${inviteEmail.trim()} — they can log in with password "welcome1".` })
      setInviteEmail('')
      setInviteName('')
      await reloadMeta()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Invite failed' })
    } finally {
      setBusy(false)
    }
  }

  const changeRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      await api(`/teams/${team!.id}/members/${userId}`, { method: 'PATCH', body: { role: newRole } })
      await reloadMeta()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Failed' })
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await api(`/teams/${team!.id}/members/${userId}`, { method: 'DELETE' })
      await reloadMeta()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Failed' })
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8 app-scroll">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Members</h1>
        <p className="mt-1 text-[13.5px] text-stone-500">{team?.name} · {members.length} member{members.length === 1 ? '' : 's'}</p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/70">
                <th className="px-5 py-3 text-[11px] font-bold tracking-wide text-stone-400">MEMBER</th>
                <th className="px-5 py-3 text-[11px] font-bold tracking-wide text-stone-400">ROLE</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-stone-50 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: m.avatarColor }}>
                        {initials(m.name)}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-stone-800">{m.name}</p>
                        <p className="text-[12px] text-stone-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {isAdmin && m.role === 'admin' ? (
                      <span className="rounded-full bg-orange-100/70 px-2.5 py-1 text-[12px] font-bold text-[#EA6A2C]">Admin</span>
                    ) : isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value as 'admin' | 'member')}
                        data-testid={`role-${m.email}`}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-[12.5px] font-semibold text-stone-600 outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-bold text-stone-500">{m.role === 'admin' ? 'Admin' : 'Member'}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        data-testid={`remove-${m.email}`}
                        className="rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAdmin ? (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-[13px] font-bold text-stone-800">Invite a teammate</h2>
            <p className="mt-0.5 text-[12.5px] text-stone-500">Existing accounts are linked; new emails get a provisioned account (temporary password <code className="rounded bg-stone-100 px-1 font-semibold">welcome1</code>).</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                data-testid="invite-email"
                className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#F2742D]"
              />
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Name (optional)"
                className="w-36 rounded-lg border border-stone-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#F2742D]"
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')} className="rounded-lg border border-stone-200 px-2.5 py-2 text-[13px] outline-none">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="button" disabled={!inviteEmail.includes('@') || busy} onClick={invite} data-testid="invite-submit" className="btn-orange h-10 px-5 text-[13.5px] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
                {busy ? 'Inviting…' : 'Invite'}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-stone-100/70 px-4 py-3 text-[13px] text-stone-500">Only workspace admins can invite members or change roles.</p>
        )}

        {msg && (
          <p className={`mt-4 rounded-xl px-4 py-3 text-[13.5px] font-semibold ${msg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>
        )}
      </div>
    </div>
  )
}

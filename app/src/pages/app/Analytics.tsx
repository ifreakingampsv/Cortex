import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../../lib/api'
import { useWorkspace } from '../../lib/workspace'
import { fmtMinutes, fmtMinutesLong, todayStr } from '../../lib/util'
import type { Analytics } from '../../lib/types'

export default function Analytics() {
  const { team } = useWorkspace()
  const [data, setData] = useState<Analytics | null>(null)

  const from = todayStr(-6)
  const to = todayStr(0)

  const load = useCallback(async () => {
    if (!team) return
    const res = await api<Analytics>(`/teams/${team.id}/analytics?from=${from}&to=${to}`)
    setData(res)
  }, [team, from, to])

  useEffect(() => { load() }, [load])

  const days = useMemo(() => {
    if (!data) return []
    const list: { date: string; label: string; [project: string]: number | string }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = todayStr(-i)
      const row: { date: string; label: string; [project: string]: number | string } = {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      }
      for (const r of data.byDay.filter((b) => b.date === date)) {
        row[r.projectName] = Math.round((row[r.projectName] as number ?? 0) + r.minutes)
      }
      list.push(row)
    }
    return list
  }, [data])

  const projectNames = useMemo(() => {
    const names = new Map<string, string>()
    const colors = new Map<string, string>()
    for (const r of data?.byDay ?? []) {
      names.set(r.projectName, r.projectName)
      colors.set(r.projectName, r.color)
    }
    return Array.from(names.keys()).map((n) => ({ name: n, color: colors.get(n) ?? '#A8A29E' }))
  }, [data])

  const totalLogged = data?.byDay.reduce((s, r) => s + r.minutes, 0) ?? 0

  return (
    <div className="h-full overflow-y-auto px-6 py-8 app-scroll">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Analytics</h1>
        <p className="mt-1 text-[13.5px] text-stone-500">Where your time went in the last 7 days — aggregated from focus sessions and manual entries.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ['Time logged', fmtMinutesLong(totalLogged)],
            ['Tasks completed', String(data?.completed.length ?? 0)],
            ['Highlights written', String(data?.highlights.length ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-[11px] font-bold tracking-wide text-stone-400">{label.toUpperCase()}</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5" data-testid="analytics-chart">
          <h2 className="text-[13px] font-bold text-stone-800">What got done</h2>
          <p className="text-[12px] text-stone-400">Minutes logged per day, stacked by project</p>
          <div className="mt-4 h-64">
            {days.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#78716C' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(m: number) => fmtMinutes(m)} tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [fmtMinutes(Number(value)), String(name)]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 12 }}
                  />
                  {projectNames.map((p, i) => (
                    <Bar key={p.name} dataKey={p.name} stackId="a" fill={p.color} radius={i === projectNames.length - 1 ? [4, 4, 0, 0] : undefined} maxBarSize={34} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-stone-400">No time logged yet — run a focus session.</p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {projectNames.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-[13px] font-bold text-stone-800">Completed in the last 7 days</h2>
          <div className="mt-3 space-y-1.5">
            {data?.completed.map((c) => (
              <p key={c.id} className="flex items-center gap-2 text-[13.5px]">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5FC48F] text-[9px] text-white">✓</span>
                <span className="font-medium text-stone-800">{c.title}</span>
                <span className="text-[11.5px] text-stone-400">{new Date(c.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </p>
            ))}
            {(data?.completed.length ?? 0) === 0 && <p className="text-[13px] text-stone-400">Nothing yet.</p>}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-100 bg-gradient-to-b from-[#FEF6EC] to-white p-5" data-testid="highlights-feed">
          <h2 className="text-[13px] font-bold text-stone-800">Daily highlights</h2>
          <div className="mt-3 space-y-2">
            {data?.highlights.map((h) => (
              <p key={h.id} className="rounded-lg bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-stone-700 ring-1 ring-orange-100">
                <span className="font-bold">{h.user_name}</span> <span className="text-stone-400">· {h.date}</span><br />{h.body}
              </p>
            ))}
            {(data?.highlights.length ?? 0) === 0 && (
              <p className="text-[13px] text-stone-400">No highlights yet — write your first one from the Daily shutdown ritual.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

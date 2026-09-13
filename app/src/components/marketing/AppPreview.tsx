/**
 * HTML recreation of the Cortex product composition used in the hero
 * (sidebar + day columns + calendar panel). Decorative composition.
 */

function MiniCheck({ done = false }: { done?: boolean }) {
  return done ? (
    <span className="mt-[1px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-[#5FC48F]">
      <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M2 5.2 4.2 7.4 8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
    </span>
  ) : (
    <span className="mt-[1px] h-3 w-3 shrink-0 rounded-full border-[1.3px] border-stone-300" />
  )
}

function TaskCard({
  title, estimate, subtasks, chips, timebox, done,
}: {
  title: string
  estimate: string
  subtasks?: { text: string; done: boolean }[]
  chips?: { name: string; color: string; icon?: boolean }[]
  timebox?: string
  done?: boolean
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-1.5">
        <MiniCheck done={done} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[10.5px] font-medium leading-snug text-stone-800 ${done ? 'line-through opacity-60' : ''}`}>{title}</p>
            <span className="shrink-0 rounded bg-stone-100 px-1 py-px text-[8.5px] font-semibold text-stone-500">{estimate}</span>
          </div>
          {subtasks?.map((s) => (
            <div key={s.text} className="mt-1 flex items-center gap-1.5">
              <MiniCheck done={s.done} />
              <span className={`text-[9px] leading-tight text-stone-500 ${s.done ? 'line-through opacity-70' : ''}`}>{s.text}</span>
            </div>
          ))}
          {timebox && (
            <div className="mt-1.5">
              <span className="rounded bg-[#F6A03C] px-1 py-px text-[8px] font-bold text-white">{timebox}</span>
            </div>
          )}
          {chips && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {chips.map((c) => (
                <span key={c.name} className="inline-flex items-center gap-1 text-[8.5px] font-semibold" style={{ color: c.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  #{c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const EVENTS = [
  { top: 26, h: 16, label: 'Morning routine', color: '#7CA6F0', time: '7 - 7:20' },
  { top: 118, h: 26, label: 'Product demo with Jenn', color: '#A78BFA', time: '10 - 11' },
  { top: 196, h: 16, label: 'Lunch', color: '#7CA6F0', time: '12 - 1' },
  { top: 236, h: 34, label: 'Review prototype of new feature', color: '#A78BFA', time: '1 - 3' },
]

export default function AppPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-16px_rgba(120,72,20,0.25)]">
      <div className="flex" style={{ height: 480 }}>
        {/* Sidebar */}
        <div className="hidden w-[128px] shrink-0 flex-col border-r border-stone-100 bg-[#FBFAF9] px-3 py-3 sm:flex">
          <div className="mb-3 flex items-center gap-1 text-[11px] font-bold text-stone-800">
            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#F6A03C] to-[#EF5A2E]" />
            Cortex <span className="text-[8px] text-stone-400">▼</span>
          </div>
          {[
            ['Home', true], ['Today', false], ['Focus', false],
          ].map(([label, active]) => (
            <div key={label as string} className={`mb-0.5 rounded px-1.5 py-1 text-[10px] ${active ? 'bg-stone-200/70 font-semibold text-stone-800' : 'text-stone-500'}`}>
              {label as string}
            </div>
          ))}
          <div className="mt-3 mb-1 px-1.5 text-[7.5px] font-bold tracking-widest text-stone-400">DAY</div>
          {['Daily planning', 'Daily shutdown', 'Daily highlights'].map((l) => (
            <div key={l} className="mb-0.5 px-1.5 py-0.5 text-[9.5px] text-stone-500">{l}</div>
          ))}
          <div className="mt-2 mb-1 px-1.5 text-[7.5px] font-bold tracking-widest text-stone-400">WEEK</div>
          {['Weekly planning', 'Weekly review'].map((l) => (
            <div key={l} className="mb-0.5 px-1.5 py-0.5 text-[9.5px] text-stone-500">{l}</div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-1.5">
            <span className="rounded bg-stone-100 px-2 py-0.5 text-[9px] font-semibold text-stone-600">☰ Today</span>
            <div className="flex gap-1.5">
              <span className="rounded border border-stone-200 px-2 py-0.5 text-[9px] font-semibold text-stone-500">⊞ Board</span>
              <span className="rounded border border-stone-200 px-2 py-0.5 text-[9px] font-semibold text-stone-500">▤ Calendars</span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2.5 p-2.5">
            {[
              {
                day: 'Monday', date: 'January 10', load: '3:00',
                tasks: [
                  { title: 'Build daily notes feature', estimate: '1:00', subtasks: [{ text: 'Mocks', done: false }, { text: 'Data model', done: false }, { text: 'Basic functionality', done: false }], chips: [{ name: 'product', color: '#F59E0B' }] },
                  { title: 'Document customer feedback', estimate: '1:30', subtasks: [{ text: 'Summarize customer churn surveys', done: true }, { text: 'Review top posts in Camy', done: false }], chips: [{ name: 'product', color: '#F59E0B' }] },
                  { title: 'Investigate secondary growth channels', estimate: '1:00', chips: [{ name: 'planning', color: '#8B5CF6' }] },
                  { title: 'Product demo with Jenn', estimate: '1:30', timebox: '1:00', chips: [{ name: 'growth', color: '#3B82F6' }] },
                ],
              },
              {
                day: 'Tuesday', date: 'January 11', load: '3:00',
                tasks: [
                  { title: 'Answer customer support tickets', estimate: '0:30', subtasks: [], chips: [{ name: 'growth', color: '#3B82F6' }] },
                  { title: 'Investigate secondary growth channels', estimate: '0:30', chips: [{ name: 'growth', color: '#3B82F6' }] },
                  { title: 'Review prototype of new feature', estimate: '2:00', chips: [{ name: 'product', color: '#F59E0B' }] },
                  { title: '1:1 with Tomoka', estimate: '0:30', timebox: '1:00', chips: [{ name: 'growth', color: '#3B82F6' }] },
                ],
              },
            ].map((col) => (
              <div key={col.day} className="min-w-0">
                <div className="mb-1 px-1">
                  <p className="text-[11px] font-bold text-stone-800">{col.day}</p>
                  <p className="text-[8.5px] text-stone-400">{col.date}</p>
                  <div className="mt-1 h-[3px] w-full rounded bg-stone-100">
                    <div className="h-full w-2/3 rounded bg-[#F0A742]" />
                  </div>
                </div>
                <div className="mb-1.5 flex items-center justify-between rounded-md border border-dashed border-stone-200 px-2 py-1">
                  <span className="text-[9px] font-semibold text-stone-400">+ Add task</span>
                  <span className="text-[8px] font-bold text-stone-400">8:00</span>
                </div>
                <div className="space-y-1.5">
                  {col.tasks.map((t) => <TaskCard key={t.title} {...t} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="hidden w-[150px] shrink-0 border-l border-stone-100 px-2 py-2 md:block">
          <div className="mb-1 rounded-md border border-stone-200 px-1.5 py-1">
            <p className="text-[8px] font-bold tracking-wide text-stone-400">MON</p>
            <p className="text-[13px] font-bold leading-none text-stone-800">10</p>
          </div>
          <div className="relative" style={{ height: 300 }}>
            {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((h) => (
              <div key={h} className="absolute left-0 right-0 flex items-center gap-1" style={{ top: (h - 7) * 34 }}>
                <span className="w-5 shrink-0 text-right text-[7px] text-stone-400">{h % 12 === 0 ? 12 : h % 12}{h < 12 ? ' AM' : ' PM'}</span>
                <span className="h-px flex-1 bg-stone-100" />
              </div>
            ))}
            {EVENTS.map((e) => (
              <div
                key={e.label}
                className="absolute left-6 right-0 rounded px-1 py-0.5 text-[7.5px] font-semibold leading-tight text-white"
                style={{ top: e.top, height: e.h, background: e.color }}
              >
                {e.label}
                <span className="block text-[6.5px] font-normal opacity-90">{e.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Icon rail */}
        <div className="hidden w-[34px] shrink-0 flex-col items-center gap-1.5 border-l border-stone-100 py-3 lg:flex">
          {['#7CA6F0', '#EF5A2E', '#A78BFA', '#5FC48F', '#F0A742', '#F2742D'].map((c, i) => (
            <span key={c} className="flex h-5 w-5 items-center justify-center rounded" style={{ background: i % 2 ? '#F5F4F2' : '#fff', border: '1px solid #ECEAE7' }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c, opacity: 0.85 }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

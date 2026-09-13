import { useState } from 'react'
import { Link } from 'react-router'
import { CortexLogo, SunCloudIcon } from '../../components/Logo'
import AppPreview from '../../components/marketing/AppPreview'
import { useRevealOnScroll } from '../../hooks/useReveal'

/* ---------------------------------- shared ---------------------------------- */

function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-200/80 bg-white/80 px-4 py-2 shadow-sm">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#F6A03C] to-[#EF5A2E] text-[10px] text-white">☀</span>
      <span className="text-[13px] font-bold text-stone-800">The calm daily planner for busy professionals</span>
    </div>
  )
}

function SectionPill({ children }: { children: React.ReactNode }) {
  return <span className="pill-badge">{children}</span>
}

const LOGOS = ['Contoso', 'Initech', 'Globex', 'Acme Corp', 'Vandelay', 'Northwind', 'Umbrella Co', 'Soylent']

function LogoMarquee() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-14 pr-14">
      {LOGOS.map((l) => (
        <span key={l} className="whitespace-nowrap text-lg font-bold tracking-tight text-stone-400/90">
          {l}
        </span>
      ))}
    </div>
  )
  return (
    <div className="overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee-track">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}

/* ------------------------------- testimonials -------------------------------- */

const TESTIMONIALS = [
  { quote: 'Cortex is the first planner that actually helps me end the day on time. The daily shutdown ritual changed how I work.', name: 'Maya Chen', title: 'Head of Product, Northwind' },
  { quote: "I've tried every task manager out there. Cortex is the one that stuck — timeboxing my day keeps me honest.", name: 'Daniel Okafor', title: 'Engineering Lead, Contoso' },
  { quote: 'One clear plan for tasks and meetings. My focus time is finally protected, and I stop working when I planned to.', name: 'Sofia Marín', title: 'Founder, Vandelay Studio' },
]

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0)
  const t = TESTIMONIALS[idx]
  return (
    <div className="rounded-2xl border border-stone-100 bg-[#FBF7F1] p-5">
      <div key={idx} className="rounded-xl bg-white p-4 shadow-sm" style={{ animation: 'reveal .4s ease-out both' }}>
        <p className="text-[15px] leading-relaxed text-stone-700">{t.quote}</p>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F6A03C] to-[#EF5A2E] text-sm font-bold text-white">
            {t.name.split(' ').map((w) => w[0]).join('')}
          </span>
          <div>
            <p className="text-sm font-bold text-stone-800">{t.name}</p>
            <p className="text-xs text-stone-500">{t.title}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="next slide"
          onClick={() => setIdx((i) => (i + 1) % TESTIMONIALS.length)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-[#F2742D] hover:text-[#F2742D]"
        >
          →
        </button>
      </div>
    </div>
  )
}

/* ------------------------------- feature blocks ------------------------------ */

function FeatureMini({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-[#FBFAF8] p-5 text-center shadow-[0_10px_30px_-18px_rgba(120,72,20,0.25)] transition-transform duration-200 hover:-translate-y-1">
      <p className="mx-auto max-w-[240px] text-[15px] font-semibold leading-snug text-stone-700">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function MiniTodayCard() {
  return (
    <div className="mx-auto w-44 rounded-lg border border-stone-200 bg-white p-2 text-left shadow-sm">
      <p className="text-[10px] font-bold text-stone-800">Today</p>
      <p className="text-[7.5px] text-stone-400">Fill in your work for today</p>
      <div className="mt-1.5 rounded border border-dashed border-stone-200 px-1.5 py-1 text-[8px] text-stone-400">+ Add a task</div>
      {[['Document customer feedback', '#F59E0B'], ['Product demo with Jenn', '#3B82F6']].map(([t, c]) => (
        <div key={t} className="mt-1 flex items-center gap-1 rounded border border-stone-100 px-1.5 py-1">
          <span className="h-2 w-2 rounded-full border border-stone-300" />
          <span className="flex-1 truncate text-[7.5px] text-stone-600">{t}</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
        </div>
      ))}
    </div>
  )
}

function MiniCalendarCard() {
  return (
    <div className="relative mx-auto h-44 w-44 rounded-lg border border-stone-200 bg-white p-2 text-left shadow-sm">
      <p className="text-[8px] font-bold text-stone-400">MON</p>
      <p className="text-sm font-bold leading-none text-stone-800">10</p>
      <div className="absolute inset-x-2 bottom-2 space-y-1.5">
        <div className="rounded bg-[#7CA6F0] px-1.5 py-1 text-[7.5px] font-semibold text-white">Delphia sync 8 - 8:30 AM</div>
        <div className="rounded bg-[#F0A742] px-1.5 py-1 text-[7.5px] font-semibold text-white">Document customer feedback 9 - 10 AM</div>
        <div className="rounded bg-[#A78BFA] px-1.5 py-1 text-[7.5px] font-semibold text-white">Product demo with Jenn 11 - 12 PM</div>
      </div>
    </div>
  )
}

function MiniToolsCard() {
  const tiles = [
    { label: 'N', bg: '#111' }, { label: 'T', bg: '#0079BF' }, { label: '◔', bg: '#F5F4F2', fg: '#E8622D' },
    { label: 'J', bg: '#2684FF' }, { label: 'G', bg: '#111' }, { label: 'M', bg: '#EA4335' },
    { label: 'S', bg: '#611F69' }, { label: '☑', bg: '#F5F4F2', fg: '#0EA5E9' }, { label: '✉', bg: '#F5F4F2', fg: '#EA4335' },
  ]
  return (
    <div className="mx-auto grid w-44 grid-cols-3 gap-2">
      {tiles.map((t, i) => (
        <span key={i} className="flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white text-sm font-black shadow-sm" style={{ color: t.fg ?? '#fff', background: t.bg === '#F5F4F2' ? '#F5F4F2' : t.bg }}>
          {t.label}
        </span>
      ))}
    </div>
  )
}

function MiniFocusCard() {
  return (
    <div className="mx-auto w-48 rounded-xl bg-stone-900 p-3 text-left shadow-lg">
      <p className="text-[9px] font-semibold text-stone-300">Respond to user feedback</p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="font-mono text-xl font-bold text-white">0:23:49</p>
        <p className="text-[8px] text-stone-400">planned 2:30</p>
      </div>
      <div className="mt-2 h-1 rounded bg-stone-700"><div className="h-full w-1/3 rounded bg-[#F2742D]" /></div>
      <p className="mt-2 text-[8px] text-stone-400">Review previous threads</p>
      <p className="text-[8px] text-stone-500">Create a demo of new approach</p>
    </div>
  )
}

function MiniBreakCard() {
  return (
    <div className="mx-auto flex w-44 flex-col items-center rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
      <span className="rounded-md bg-[#3B82F6] px-2.5 py-1 text-[10px] font-bold text-white">Ready for a break?</span>
      <div className="mt-2 flex gap-2 text-lg">
        <span>🥳</span><span>🤔</span><span>🤓</span>
      </div>
    </div>
  )
}

function MiniShutdownCard() {
  return (
    <div className="mx-auto w-48 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center gap-2">
        <SunCloudIcon size={26} />
        <div>
          <p className="text-[8px] text-stone-400">5 PM</p>
          <p className="text-[11px] font-bold text-stone-800">Daily shutdown</p>
          <p className="text-[8px] text-stone-500">Wrap up your day</p>
        </div>
      </div>
    </div>
  )
}

function MiniAnalyticsCard() {
  const bars = [30, 55, 40, 70, 45, 25]
  return (
    <div className="mx-auto w-44 rounded-lg border border-stone-200 bg-white p-2 text-left shadow-sm">
      <p className="text-[9px] font-bold text-stone-800">What got done</p>
      <p className="text-[7px] text-stone-400">You logged 36 hours this week</p>
      <div className="mt-2 flex h-16 items-end gap-1.5">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 rounded-t bg-stone-200" style={{ height: `${b}%` }}>
            <div className="h-1/2 rounded-t bg-[#F2742D]/80" style={{ height: `${30 + i * 8}%`, marginTop: 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[6px] text-stone-400">
        {['M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
    </div>
  )
}

function MiniNotesCard() {
  return (
    <div className="mx-auto w-52 rounded-xl border border-stone-200 bg-white p-3 text-left shadow-sm">
      <p className="text-[9px] font-bold text-stone-800">🧑 Monday ☕</p>
      <p className="mt-0.5 text-[7.5px] leading-relaxed text-stone-500">
        Today was great. After our meeting, I got focused, investigated the save issue, and knocked out some reviews. We should be ready to launch!
      </p>
      <div className="mt-1.5 space-y-1">
        {[
          ['Investigate: can’t save notes', '#8B5CF6'],
          ['Weekly team reviews and reports', '#F2742D'],
          ['Team Meeting', '#0EA5E9'],
        ].map(([t, c]) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
            <span className="text-[7.5px] font-semibold text-stone-700">{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniActualCard() {
  return (
    <div className="relative mx-auto h-44 w-44 rounded-lg border border-stone-200 bg-white p-2 text-left shadow-sm">
      <p className="text-[8px] font-bold text-stone-400">MON</p>
      <p className="text-sm font-bold leading-none text-stone-800">10</p>
      <div className="absolute inset-x-2 bottom-2 space-y-1.5">
        <div className="rounded border-2 border-dashed border-[#F0A742] px-1.5 py-1 text-[7.5px] font-semibold text-[#B47617]">
          <span className="float-right text-[6.5px] text-stone-400">Actual</span>Document customer feedback 9 - 10 AM
        </div>
        <div className="rounded bg-[#F0A742]/30 px-1.5 py-1 text-[7.5px] font-semibold text-stone-500">Planned</div>
        <div className="rounded bg-[#A78BFA] px-1.5 py-1 text-[7.5px] font-semibold text-white">Product demo with Jenn 11 - 12 PM</div>
      </div>
    </div>
  )
}

const FEATURE_GROUPS = [
  {
    emoji: '☀️', pill: 'Start your Day', headline: <span>Start each<br />day with <span className="text-gradient-warm">clarity</span></span>,
    copy: 'Plan your day with intention by aligning your goals, prioritizing tasks, and a setting a realistic workload',
    visual: (
      <div className="flex items-center justify-center gap-6">
        <div className="w-40 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm">
          <p className="text-[11px] font-bold text-stone-800">Today</p>
          <p className="text-[7.5px] text-stone-400">Fill in your work for today</p>
          <div className="mt-1 h-1.5 rounded bg-stone-100" />
          <div className="mt-1.5 rounded border border-dashed border-stone-200 px-1.5 py-1 text-right text-[8px] text-stone-400">Add task <span className="float-left font-bold">+</span></div>
          {[['Check and respond to notifications', '0:30'], ['Team meeting', '1:00'], ['Respond to Delphia questions', '1:00']].map(([t, e], i) => (
            <div key={t} className="mt-1.5">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-stone-300" />
                <span className="flex-1 truncate text-[7.5px] font-medium text-stone-600">{t}</span>
                <span className="text-[7px] text-stone-400">{e}</span>
              </div>
              {i === 0 && <p className="ml-3 text-[6.5px] text-stone-400">8:00 am · ☀ Daily intentions</p>}
              {i === 1 && <p className="ml-3 rounded bg-[#F6A03C] px-1 text-[6px] font-bold text-white">timebox</p>}
              {i === 2 && <p className="ml-3 text-[6.5px] text-[#F59E0B]">#product</p>}
            </div>
          ))}
        </div>
        <div className="hidden w-36 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm md:block">
          <p className="text-[9px] font-bold text-stone-400">Calendar</p>
          <div className="mt-1 rounded-md border border-stone-200 px-1.5 py-1">
            <p className="text-[7px] font-bold text-stone-400">MON</p>
            <p className="text-[12px] font-bold leading-none text-stone-800">10</p>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="rounded bg-[#7CA6F0] px-1 py-0.5 text-[6.5px] font-semibold text-white">Check and respond to notifications</div>
            <div className="rounded bg-[#F06AA8] px-1 py-0.5 text-[6.5px] font-semibold text-white">Build for Zuma 1 - 2</div>
            <div className="rounded bg-[#F0A742] px-1 py-0.5 text-[6.5px] font-semibold text-white">Team meeting 12 - 1</div>
            <div className="rounded bg-[#7CA6F0] px-1 py-0.5 text-[6.5px] font-semibold text-white">Respond to Delphia questions 2 - 3</div>
          </div>
        </div>
      </div>
    ),
    minis: [
      { title: 'Plan what you need to get done today, without losing focus on tomorrow', visual: <MiniTodayCard /> },
      { title: 'Visualize and block time for work on your calendar', visual: <MiniCalendarCard /> },
      { title: 'Unify your work across your different tools and organize it', visual: <MiniToolsCard /> },
    ],
  },
  {
    emoji: '🌀', pill: 'Work through your day', headline: <span>Stay focused<br />and on track all day</span>,
    copy: 'Easily adjust your daily plan without losing focus or taking on too much',
    visual: <MiniFocusCard />,
    minis: [
      { title: 'Pull in new tasks or events as you work', visual: <MiniTodayCard /> },
      { title: 'Mute apps to reduce distractions', visual: <MiniBreakCard /> },
      { title: 'Automatic reminders to help you take breaks and maintain energy', visual: <MiniBreakCard /> },
    ],
  },
  {
    emoji: '🌤️', pill: 'Make every day count', headline: <span>End each day<br />feeling <span className="text-gradient-warm">successful</span></span>,
    copy: 'Automatically track your daily wins, record your progress, and finish the day feeling calm and accomplished',
    visual: <MiniNotesCard />,
    minis: [
      { title: 'See where your time actually went', visual: <MiniAnalyticsCard /> },
      { title: 'Visualize your work on your calendar', visual: <MiniActualCard /> },
      { title: 'End work on time, without guilt', visual: <MiniShutdownCard /> },
    ],
  },
]

/* --------------------------------- integrations ------------------------------ */

const INTEGRATION_CATEGORIES = [
  {
    title: 'Calendar Apps',
    lead: 'One calendar to rule your day',
    copy: '. View every calendar in one place and timebox tasks directly on your schedule, so you always know what fits today.',
    apps: [
      { label: 'G', bg: 'white', fg: '#4285F4' }, { label: ' Outlook', bg: 'white', fg: '#0F6CBD' }, { label: 'Apple', bg: 'white', fg: '#111' },
    ],
  },
  {
    title: 'Project Management Apps',
    lead: 'Tame your backlog, one day at a time.',
    copy: ' Pull tasks from tools like Asana, Trello, or Jira into a focused daily plan so you never feel buried under endless to-dos.',
    apps: [
      { label: '◆', bg: 'white', fg: '#F06A6A' }, { label: 'ClickUp', bg: 'white', fg: '#7B68EE' }, { label: 'GitHub', bg: '#111', fg: '#fff' },
      { label: 'Linear', bg: 'white', fg: '#5E6AD2' }, { label: 'monday', bg: 'white', fg: '#FF3D57' }, { label: 'Jira', bg: 'white', fg: '#2684FF' },
    ],
  },
  {
    title: 'Task Management Apps',
    lead: 'For everything on your plate.',
    copy: ' From work projects to personal chores, bring your tasks together and plan a realistic day that fits both.',
    apps: [
      { label: 'Trello', bg: 'white', fg: '#0079BF' }, { label: 'Google Tasks', bg: 'white', fg: '#4285F4' }, { label: 'To-Do', bg: 'white', fg: '#2564CF' },
      { label: 'todoist', bg: 'white', fg: '#E44332' }, { label: 'Notion', bg: 'white', fg: '#111' },
    ],
  },
  {
    title: 'Email and Messaging Apps',
    lead: 'Turn communication into action',
    copy: '. Drag emails into your task list to work on them later, or convert Slack and Teams messages into tasks so follow-ups don’t slip through the cracks.',
    apps: [
      { label: 'Slack', bg: 'white', fg: '#611F69' }, { label: 'Teams', bg: 'white', fg: '#6264A7' }, { label: 'Gmail', bg: 'white', fg: '#EA4335' }, { label: 'Outlook', bg: 'white', fg: '#0F6CBD' },
    ],
  },
]

/* ---------------------------------- compare ---------------------------------- */

const COMPARE_ROWS = [
  ['Calendar integration', 1, 1, 1, 1, 1],
  ['Timeboxing', 1, 1, 1, 0, 0],
  ['Auto-scheduling', 1, 0, 1, 1, 0],
  ['Task app integrations', 1, 1, 0, 0, 0],
  ['Zapier/Automation integrations', 1, 1, 1, 1, 1],
  ['Guided planning & rituals', 1, 1, 0, 0, 0],
  ['Daily shutdown & highlights', 1, 1, 0, 0, 0],
  ['Focus mode / Pomodoro', 1, 1, 0, 0, 0],
  ['Analytics', 1, 1, 1, 1, 0],
  ['Meeting scheduling links', 0, 1, 1, 0, 0],
]
const COMPETITORS = ['CalBook', 'Schedulix', 'FlowDeck', 'TaskNest', 'DailyKit']

function CheckMark({ dim = false }: { dim?: boolean }) {
  return dim ? (
    <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-400">✕</span>
  ) : (
    <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#F6A03C] to-[#EF5A2E] text-[10px] font-bold text-white shadow-sm">✓</span>
  )
}

/* --------------------------------- community --------------------------------- */

const COMMUNITY_PEOPLE = [
  { emoji: '🤩', bg: 'linear-gradient(135deg,#FDE7D2,#F9C9A8)' },
  { emoji: '🥳', bg: 'linear-gradient(135deg,#D6E8FF,#B4D3FB)' },
  { emoji: '🔥', bg: 'linear-gradient(135deg,#FFDFC2,#FBBA8B)' },
  { emoji: '❤️', bg: 'linear-gradient(135deg,#FFE1E8,#FBC4D2)' },
]

/* ----------------------------------- page ------------------------------------ */

export default function Home() {
  const rootRef = useRevealOnScroll()
  return (
    <div ref={rootRef} className="min-h-screen bg-white font-sans text-stone-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-stone-100/60 bg-[#FDF8F3]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="home"><CortexLogo /></Link>
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-stone-700 md:flex">
            <a href="#features" className="transition hover:text-stone-950">Features</a>
            <a href="#integrations" className="transition hover:text-stone-950">Integrations</a>
            <a href="#compare" className="transition hover:text-stone-950">Pricing</a>
            <a href="#community" className="transition hover:text-stone-950">Love</a>
            <a href="#community" className="transition hover:text-stone-950">About</a>
            <a href="#community" className="transition hover:text-stone-950">Blog</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[15px] font-semibold text-stone-700 transition hover:text-stone-950">Login</Link>
            <Link to="/signup" className="btn-orange h-10 px-5 text-[15px]">Start for Free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1fr_1.15fr]">
          <div className="reveal">
            <HeroBadge />
            <h1 className="mt-7 font-display text-[56px] font-bold leading-[1.04] tracking-tight text-stone-900">
              Start Calm.<br />Stay Focused.<br />End Confident.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">
              The only task manager, calendar, and daily planner for modern professionals. Eliminate distractions,
              find flow, and do more high-impact work without burning out. The digital daily planner that helps you
              feel calm and stay focused.
            </p>
            <div className="mt-8 flex items-center gap-5">
              <Link to="/signup" className="btn-orange h-12 px-7 text-base">Try for free</Link>
              <p className="text-sm leading-snug text-stone-500">14-day free trial<br />No credit card required</p>
            </div>
          </div>
          <div className="reveal" style={{ animationDelay: '0.15s' }}>
            <AppPreview />
          </div>
        </div>

        {/* Trusted + marquee */}
        <div className="mx-auto max-w-6xl px-5 pb-14">
          <div className="reveal flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {['#F6A03C', '#8B5CF6', '#EC4899', '#0EA5E9', '#22C55E'].map((c) => (
                <span key={c} className="h-8 w-8 rounded-full border-2 border-white shadow-sm" style={{ background: `linear-gradient(135deg, ${c}, ${c}CC)` }} />
              ))}
            </div>
            <p className="text-[15px] font-medium text-stone-600">Trusted by professionals who want<br className="sm:hidden" /> to do their best work every day.</p>
          </div>
          <div className="reveal mt-6"><LogoMarquee /></div>
        </div>
      </section>

      {/* Chaos → clarity */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
          <div className="reveal rounded-3xl border border-stone-100 bg-[#FDFBF8] p-9 shadow-[0_18px_50px_-30px_rgba(120,72,20,0.35)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F6EEE4] text-4xl">😰</span>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-stone-900">
              Work is<br />f***ing chaotic
            </h2>
            <ul className="mt-7 space-y-4">
              {['Always on, working late, never done', 'Constantly interrupted and losing focus', 'Struggling to manage tasks and meetings'].map((p) => (
                <li key={p} className="flex items-center gap-3 text-[15px] font-medium text-stone-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#F87171] to-[#EF4444] text-[11px] font-bold text-white">✕</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-3xl border border-orange-100 bg-gradient-to-b from-[#FEF3E7] to-[#FDE9DA] p-9 shadow-[0_18px_50px_-30px_rgba(242,116,45,0.5)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm"><SunCloudIcon size={40} /></span>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight text-stone-900">
              Cortex turns<br />chaos into <span className="text-gradient-warm">clarity</span>
            </h2>
            <ul className="mt-7 space-y-4">
              {['End the day on time, feeling accomplished', 'Block focus time and actually protect it', 'See tasks and meetings together in one clear plan'].map((p) => (
                <li key={p} className="flex items-center gap-3 text-[15px] font-medium text-stone-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#4ADE80] to-[#22C55E] text-[11px] font-bold text-white">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-7"><TestimonialCarousel /></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-peach-bg py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal text-center">
            <SectionPill>Features</SectionPill>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-[44px] font-bold leading-[1.12] tracking-tight text-stone-900">
              Cortex is purpose-built to help <span className="text-gradient-warm">modern professionals</span> do great work, without burning out
            </h2>
          </div>

          {FEATURE_GROUPS.map((g, gi) => (
            <div key={g.pill} className="mt-14">
              <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-[15px] font-semibold text-stone-700 shadow-sm">
                <span>{g.emoji}</span> {g.pill}
              </div>
              <div className="reveal mt-4 grid items-center gap-8 rounded-3xl border border-stone-200/60 bg-white/85 p-8 shadow-[0_20px_60px_-35px_rgba(120,72,20,0.4)] md:grid-cols-2 md:p-10">
                <div>
                  <h3 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-stone-900">{g.headline}</h3>
                  <p className="mt-5 max-w-md text-[17px] leading-relaxed text-stone-600">{g.copy}</p>
                </div>
                <div className="min-h-[240px] rounded-2xl bg-[#FBFAF8] p-6 ring-1 ring-stone-100">{g.visual}</div>
              </div>
              <div className="reveal mt-5 grid gap-5 md:grid-cols-3">
                {g.minis.map((m) => (
                  <FeatureMini key={m.title} title={m.title}>{m.visual}</FeatureMini>
                ))}
              </div>
              {gi < FEATURE_GROUPS.length - 1 && <div className="mt-14" />}
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal text-center">
            <SectionPill>Integrations</SectionPill>
            <h2 className="mt-5 font-display text-[44px] font-bold tracking-tight text-stone-900">All your work tools, integrated</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">Create a single, unified list of all the work you need to do, from any of the tools you use</p>
          </div>
          <div className="mt-10 space-y-6">
            {INTEGRATION_CATEGORIES.map((c) => (
              <div key={c.title} className="reveal rounded-3xl border border-stone-200/70 bg-[#FBFAF8] p-8 shadow-[0_16px_40px_-30px_rgba(120,72,20,0.3)] md:flex md:items-center md:gap-10">
                <div className="md:w-[340px]">
                  <h3 className="text-2xl font-bold tracking-tight text-stone-900">{c.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-stone-600">
                    <strong className="font-bold text-stone-800">{c.lead}</strong>
                    {c.copy}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:flex-1 md:justify-end">
                  {c.apps.map((a) => (
                    <span key={a.label} className="flex h-16 min-w-16 items-center justify-center rounded-2xl border border-stone-200/80 bg-white px-3 text-[13px] font-bold shadow-sm" style={{ color: a.fg }}>
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-14 text-center">
            <h3 className="text-xl font-semibold text-stone-800">Looking for more?</h3>
            <p className="mt-1 text-lg font-semibold text-stone-800">Everything you need, and nothing you don’t</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              { title: 'Weekly Objectives', copy: 'Set and track weekly goals to focus on what truly matters', visual: <MiniTodayCard /> },
              { title: 'Pomodoro Timer', copy: 'Use Pomodoro timers to maintain flow and prevent burnout', visual: <MiniFocusCard /> },
              { title: 'Bi-directional Calendar Sync', copy: 'Cortex syncs with Google, Outlook, and Apple calendar', visual: <MiniCalendarCard /> },
              { title: 'Analytics', copy: 'Understand your daily & weekly time use to optimize workload and energy', visual: <MiniAnalyticsCard /> },
            ].map((c) => (
              <div key={c.title} className="reveal rounded-3xl border border-stone-200/70 bg-[#FBFAF8] p-8 shadow-[0_16px_40px_-30px_rgba(120,72,20,0.3)]">
                <h4 className="text-xl font-bold tracking-tight text-stone-900">{c.title}</h4>
                <p className="mt-2 max-w-sm text-[15px] text-stone-600">{c.copy}</p>
                <div className="mt-5">{c.visual}</div>
              </div>
            ))}
            <div className="reveal rounded-3xl border border-stone-200/70 bg-[#FBFAF8] p-8 shadow-[0_16px_40px_-30px_rgba(120,72,20,0.3)]">
              <h4 className="text-xl font-bold tracking-tight text-stone-900">Zapier Integration</h4>
              <p className="mt-2 max-w-sm text-[15px] text-stone-600">Connect Cortex to Zapier’s 9k+ apps to streamline workflows and trigger tasks</p>
              <button type="button" className="btn-outline-orange mt-5 h-10 px-5 text-sm">View integration</button>
            </div>
            <div className="reveal rounded-3xl border border-stone-200/70 bg-[#FBFAF8] p-8 shadow-[0_16px_40px_-30px_rgba(120,72,20,0.3)]">
              <h4 className="text-xl font-bold tracking-tight text-stone-900">Enterprise Ready: SOC2 &amp; SAML/SSO</h4>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-stone-600">
                SOC2 compliance makes it easy for your IT and Security teams to approve Cortex. Get your work
                calendars, emails, and project management tools connected. SAML &amp; SSO plans available on our
                enterprise tier.
              </p>
              <div className="mt-5 flex items-center gap-5">
                <button type="button" className="btn-outline-orange h-10 px-5 text-sm">Get Cortex approved at work</button>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0369A1] text-center text-lg">🛡️</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="section-peach-bg py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal text-center">
            <SectionPill>Compare</SectionPill>
            <h2 className="mt-5 font-display text-[44px] font-bold tracking-tight text-stone-900">Designed for work, tailored to you</h2>
          </div>
          <div className="reveal mt-10 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_24px_60px_-30px_rgba(120,72,20,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="px-6 py-4 w-1/3">
                      <span className="inline-flex items-center gap-1.5 text-lg font-bold tracking-tight text-stone-900">
                        <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#F6A03C] to-[#EF5A2E]" /> cortex
                      </span>
                    </th>
                    {COMPETITORS.map((c) => (
                      <th key={c} className="px-4 py-4 text-center text-sm font-bold tracking-wide text-stone-500">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map(([feature, ...marks]) => (
                    <tr key={feature as string} className="border-b border-stone-50 last:border-0">
                      <td className="px-6 py-3.5 text-[15px] font-medium text-stone-700">{feature as string}</td>
                      {marks.map((m, i) => (
                        <td key={i} className="px-4 py-3.5 text-center"><CheckMark dim={!m} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="reveal mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl px-8 py-7 text-white shadow-lg md:flex-row md:items-center"
            style={{ background: 'linear-gradient(95deg,#F2503F 0%,#F2742D 55%,#F59E0B 100%)' }}>
            <p className="text-xl font-bold tracking-tight">Ready to replace the chaos with one calm plan?</p>
            <Link to="/signup" className="rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#EA6A2C] transition hover:bg-orange-50">Start for free</Link>
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal text-center">
            <SectionPill>Community</SectionPill>
            <h2 className="mt-5 font-display text-[40px] font-bold tracking-tight text-stone-900">Join our community</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
              Join our online community and connect with the Cortex team and thousands of seriously productive
              professionals. Email us anytime at <a className="text-[#EA6A2C] underline" href="mailto:support@cortex.app">support@cortex.app</a>.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="reveal grid grid-cols-2 gap-4">
              {COMMUNITY_PEOPLE.map((p, i) => (
                <div key={i} className="relative flex h-36 items-center justify-center rounded-2xl" style={{ background: p.bg }}>
                  <span className="text-5xl">🧑</span>
                  <span className="absolute right-3 top-3 text-2xl">{p.emoji}</span>
                </div>
              ))}
            </div>
            <div className="reveal flex flex-col justify-between rounded-2xl border border-stone-200/70 bg-[#FBFAF8] p-7">
              <div>
                <p className="text-[15px] font-semibold text-stone-700">Connect with our<br />community.</p>
                <button type="button" className="btn-outline-orange mt-4 h-10 px-5 text-sm">Join community</button>
              </div>
              <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
                <SunCloudIcon size={34} />
                <p className="mt-2 text-[15px] font-semibold text-stone-700">Learn how to get started with Cortex.</p>
                <p className="mt-1 text-sm text-stone-400">↗</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-gradient-bg py-24 text-center">
        <div className="reveal mx-auto max-w-3xl px-5">
          <span className="pill-badge">Start today</span>
          <h2 className="mt-8 font-display text-6xl font-bold tracking-tight text-stone-900">Make every day count.</h2>
          <div className="mt-8">
            <Link to="/signup" className="btn-orange h-12 px-8 text-base">Try it today</Link>
          </div>
          <p className="mt-4 text-[15px] text-stone-600">14-day free trial, no credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 bg-gradient-to-b from-[#FDF3E9] to-[#FBDDC8]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="text-center">
            <SectionPill>Download Apps</SectionPill>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {[[' iOS/iPadOS'], [' Android'], [' macOS'], [' Windows'], [' Linux']].map(([l]) => (
                <span key={l} className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-stone-800 shadow-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-[11px] text-white"></span>
                  {l.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-14 grid gap-10 border-t border-orange-200/60 pt-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
            <div>
              <h4 className="text-lg font-bold text-stone-900">Subscribe to our Newsletter</h4>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">Your weekly dose of focus and clarity. Join 300k+ people who get Cortex productivity tips and advice.</p>
              <NewsletterForm />
            </div>
            {[
              ['Integrations', ['Asana', 'ClickUp', 'GitHub', 'Gmail', 'Google Calendar', 'Google Tasks', 'Jira', 'Linear', 'Microsoft Planner', 'Microsoft Teams']],
              ['Integrations cont.', ['Microsoft To-Do', 'Monday.com', 'Notion', 'Outlook', 'Outlook Calendar', 'Slack', 'Todoist', 'Toggl', 'Trello', 'Zapier']],
              ['Users', ['Designers', 'Engineers', 'Execs & Founders', 'Product Managers', 'Marketers', 'Operations Leaders']],
              ['Resources', ['Blog', 'User Manual & Guides', 'Compare', 'Support', 'Consent Preferences', 'Vulnerability Disclosure Program']],
            ].map(([title, links]) => (
              <div key={title as string}>
                <h5 className="text-sm font-semibold text-stone-500">{title as string}</h5>
                <ul className="mt-3 space-y-2">
                  {(links as string[]).map((l) => (
                    <li key={l}><span className="cursor-pointer text-[14px] font-medium text-stone-800 transition hover:text-[#EA6A2C]">{l}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-orange-200/60 pt-6 md:flex-row">
            <div className="flex items-center gap-6 text-sm text-stone-600">
              <span>© 2025 Cortex</span>
              <span className="cursor-pointer hover:text-stone-900">Terms &amp; Conditions</span>
              <span className="cursor-pointer hover:text-stone-900">Privacy</span>
              <span className="cursor-pointer hover:text-stone-900">Status</span>
            </div>
            <div className="flex gap-2.5">
              {['𝕏', 'f', '◎', 'in'].map((s) => (
                <span key={s} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-bold text-stone-700 shadow-sm transition hover:text-[#EA6A2C]">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  return (
    <form
      className="mt-4 flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-sm ring-1 ring-stone-200/70"
      onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setDone(true) }}
    >
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Enter email"
        className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
      />
      <button type="submit" disabled={!email.includes('@')} className="btn-orange h-9 px-5 text-sm disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
        {done ? 'Subscribed ✓' : 'Submit'}
      </button>
    </form>
  )
}

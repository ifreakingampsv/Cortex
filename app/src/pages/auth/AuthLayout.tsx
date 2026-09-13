import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../lib/auth'
import { CortexLogo } from '../../components/Logo'

export function AuthShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col px-8 py-7 sm:w-[440px] sm:px-12">
        <Link to="/" aria-label="home"><CortexLogo /></Link>
        <div className="flex flex-1 flex-col justify-center">{children}</div>
        <p className="text-xs text-stone-400">© 2025 Cortex</p>
      </div>
      <div className="relative hidden flex-1 items-center justify-center bg-[#A78BFA] lg:flex">
        {right ?? <DefaultAuthArt />}
      </div>
    </div>
  )
}

function DefaultAuthArt() {
  return (
    <div className="w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex" style={{ height: 400 }}>
        <div className="w-28 border-r border-stone-100 bg-[#FBFAF9] p-3">
          <div className="mb-3 h-2.5 w-16 rounded bg-stone-200" />
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="mb-1.5 h-1.5 w-2.5 rounded-full bg-stone-200/70" style={{ display: 'inline-block', marginRight: 4 }} />
          ))}
          <div className="mt-3 space-y-2">
            {['#7CA6F0', '#5FC48F', '#F0A742', '#F2711C', '#A78BFA'].map((c) => (
              <div key={c} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                <div className="h-1.5 flex-1 rounded bg-stone-200/80" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 content-start gap-2.5 p-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-md border border-stone-100 p-2 shadow-sm">
              <div className="h-1.5 w-3/4 rounded bg-stone-300" />
              <div className="mt-1.5 flex gap-1">
                {['#A78BFA', '#EF5A2E', '#7CA6F0'][i % 3].length > 0 && (
                  <>
                    <span className="h-2 w-2 rounded-full" style={{ background: ['#A78BFA', '#EF5A2E', '#7CA6F0', '#5FC48F', '#F0A742'][i % 5] }} />
                    <span className="h-2 w-2 rounded-full bg-stone-200" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="w-24 border-l border-stone-100 p-2.5">
          <div className="mb-2 h-1.5 w-8 rounded bg-stone-200" />
          <div className="mb-4 h-4 rounded bg-[#7CA6F0]" />
          <div className="h-1.5 w-8 rounded bg-stone-200" />
          <div className="mt-2 h-10 rounded bg-[#A78BFA]" />
          <div className="mt-1.5 h-6 rounded bg-[#C4B5FD]" />
          <div className="mt-6 h-1.5 w-8 rounded bg-stone-200" />
          <div className="mt-2 h-4 rounded bg-[#F0A742]" />
          <div className="mt-1.5 h-3 rounded bg-[#F87171]" />
        </div>
      </div>
    </div>
  )
}

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      {[
        { label: 'Log in with Google', icon: <span className="font-black text-[#4285F4]">G</span> },
        { label: 'Log in with Outlook', icon: <span className="font-black text-[#0F6CBD]">O</span> },
        { label: 'Log in with SSO', icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.8-8.8" /><path d="m15 4 3 3" /><path d="m18 7 2-2" />
          </svg>
        ) },
      ].map((b) => (
        <button
          key={b.label}
          type="button"
          disabled
          title="OAuth requires provider keys — configure them in the server to enable. Use email or the demo workspace."
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-stone-300 text-[15px] font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {b.icon}
          {b.label}
        </button>
      ))}
    </div>
  )
}

export function useAuthSubmit() {
  const { login, register, demoLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      navigate('/app')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return { login, register, demoLogin, error, busy, run }
}

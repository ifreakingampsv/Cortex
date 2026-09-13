import { useState } from 'react'
import { Link } from 'react-router'
import { AuthShell, OAuthButtons, useAuthSubmit } from './AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, demoLogin, error, busy, run } = useAuthSubmit()
  const canSubmit = email.includes('@') && password.length > 0

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-[32px] font-bold tracking-tight text-slate-100">Log in</h1>
        <p className="mt-1.5 text-[15px] text-slate-400">Log in to your account</p>

        <div className="mt-7">
          <OAuthButtons />
        </div>

        <div className="my-6 flex items-center gap-4 text-xs font-semibold tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-indigo-500/15" /> OR <span className="h-px flex-1 bg-indigo-500/15" />
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) run(() => login(email, password))
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            autoComplete="email"
            className="h-11 w-full rounded-md border border-white/20 px-3.5 text-[15px] outline-none transition focus:border-[#7C5CFC] focus:ring-2 focus:ring-indigo-500/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
            className="h-11 w-full rounded-md border border-white/20 px-3.5 text-[15px] outline-none transition focus:border-[#7C5CFC] focus:ring-2 focus:ring-indigo-500/30"
          />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="h-11 w-full rounded-md text-[15px] font-semibold transition
              disabled:cursor-not-allowed disabled:bg-indigo-500/15 disabled:text-slate-600"
            style={canSubmit && !busy ? { background: '#7C5CFC', color: '#fff' } : undefined}
          >
            {busy ? 'Logging in…' : 'Log in with email'}
          </button>
        </form>

        <div className="mt-6 space-y-1.5 text-sm text-slate-400">
          <p>
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-[#A5B4FC] hover:underline">Sign up</Link>.
          </p>
          <p>
            Forgot your password?{' '}
            <span title="Password recovery emails require SMTP config in this clone" className="cursor-default text-slate-600 underline decoration-dotted">Recover password</span>.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="text-sm font-semibold text-slate-200">Just exploring?</p>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Open the seeded demo workspace (alex@acme.dev · all teammates share password <code className="rounded bg-[#101024] px-1 py-px text-[12px] font-semibold text-slate-200">demo1234</code>).
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(demoLogin)}
            className="mt-3 w-full rounded-md border-[1.5px] border-[#7C5CFC] bg-[#101024] py-2 text-sm font-bold text-[#A5B4FC] transition hover:bg-indigo-500/10 disabled:opacity-60"
          >
            Try the demo workspace
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

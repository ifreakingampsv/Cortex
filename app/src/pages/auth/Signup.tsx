import { useState } from 'react'
import { Link } from 'react-router'
import { AuthShell, useAuthSubmit } from './AuthLayout'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, error, busy, run } = useAuthSubmit()
  const canSubmit = name.trim().length > 0 && email.includes('@') && password.length >= 8

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-[32px] font-bold tracking-tight text-slate-100">Start for free</h1>
        <p className="mt-1.5 text-[15px] text-slate-400">14-day free trial · no credit card required</p>

        <form
          className="mt-7 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) run(() => register(name, email, password))
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-11 w-full rounded-md border border-white/20 px-3.5 text-[15px] outline-none transition focus:border-[#7C5CFC] focus:ring-2 focus:ring-indigo-500/30"
          />
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
            placeholder="password (min 8 characters)"
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-white/20 px-3.5 text-[15px] outline-none transition focus:border-[#7C5CFC] focus:ring-2 focus:ring-indigo-500/30"
          />
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="h-11 w-full rounded-md text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:bg-indigo-500/15 disabled:text-slate-600"
            style={canSubmit && !busy ? { background: '#7C5CFC', color: '#fff' } : undefined}
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#A5B4FC] hover:underline">Log in</Link>.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Your personal workspace is provisioned instantly with a default workflow — invite teammates later from Team settings.
        </p>
      </div>
    </AuthShell>
  )
}

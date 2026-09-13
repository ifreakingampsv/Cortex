import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { Team, User } from './types'

interface AuthState {
  user: User | null
  teams: Team[]
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  demoLogin: () => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setTeams([])
      setLoading(false)
      return
    }
    try {
      const data = await api<{ user: User; teams: Team[] }>('/auth/me')
      setUser(data.user)
      setTeams(data.teams)
    } catch {
      setToken(null)
      setUser(null)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyAuth = useCallback((data: { token: string; user: User; teams: Team[] }) => {
    setToken(data.token)
    setUser(data.user)
    setTeams(data.teams)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    applyAuth(await api('/auth/login', { method: 'POST', body: { email, password } }))
  }, [applyAuth])

  const register = useCallback(async (name: string, email: string, password: string) => {
    applyAuth(await api('/auth/register', { method: 'POST', body: { name, email, password } }))
  }, [applyAuth])

  const demoLogin = useCallback(async () => {
    applyAuth(await api('/auth/demo', { method: 'POST' }))
  }, [applyAuth])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setTeams([])
  }, [])

  const value = useMemo(
    () => ({ user, teams, loading, login, register, demoLogin, logout, refresh }),
    [user, teams, loading, login, register, demoLogin, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

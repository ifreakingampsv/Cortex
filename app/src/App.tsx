import { Routes, Route, Navigate, useLocation } from 'react-router'
import { type ReactNode } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { WorkspaceProvider } from './lib/workspace'
import { getToken } from './lib/api'
import Home from './pages/marketing/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import AppShell from './pages/app/AppShell'
import Today from './pages/app/Today'
import Board from './pages/app/Board'
import Focus from './pages/app/Focus'
import Planning from './pages/app/Planning'
import Shutdown from './pages/app/Shutdown'
import Weekly from './pages/app/Weekly'
import Analytics from './pages/app/Analytics'
import TeamPage from './pages/app/TeamPage'
import ProjectsPage from './pages/app/ProjectsPage'
import Settings from './pages/app/Settings'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDF8F3]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-[#F2742D]" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, teams } = useAuth()
  const location = useLocation()
  if (loading && getToken()) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (teams.length === 0) return <FullPageSpinner />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthGate auth="login" />} />
        <Route path="/signup" element={<AuthGate auth="signup" />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <WorkspaceGate />
            </RequireAuth>
          }
        >
          <Route index element={<Today />} />
          <Route path="board" element={<Board />} />
          <Route path="focus" element={<Focus />} />
          <Route path="planning" element={<Planning />} />
          <Route path="shutdown" element={<Shutdown />} />
          <Route path="weekly" element={<Weekly />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function AuthGate({ auth }: { auth: 'login' | 'signup' }) {
  const { user, loading } = useAuth()
  if (loading && getToken()) return <FullPageSpinner />
  if (user) return <Navigate to="/app" replace />
  return auth === 'login' ? <Login /> : <Signup />
}

function WorkspaceGate() {
  const { teams } = useAuth()
  return (
    <WorkspaceProvider teams={teams}>
      <AppShell />
    </WorkspaceProvider>
  )
}

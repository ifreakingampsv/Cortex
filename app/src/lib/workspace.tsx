import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Issue, Label, Member, Project, Status, Team } from './types'

interface WorkspaceState {
  team: Team | null
  teams: Team[]
  setTeamId: (id: string) => void
  role: 'admin' | 'member'
  members: Member[]
  projects: Project[]
  statuses: Status[]
  labels: Label[]
  loading: boolean
  reloadMeta: () => Promise<void>
  openTask: (id: string) => void
  editingTaskId: string | null
  closeTask: () => void
  taskCounter: number // increments each time a task modal opens
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

const TEAM_KEY = 'cortex_team'

export function WorkspaceProvider({
  teams,
  children,
}: {
  teams: Team[]
  children: ReactNode
}) {
  const [teamId, setTeamIdState] = useState<string>(() => {
    const saved = localStorage.getItem(TEAM_KEY)
    return saved && teams.some((t) => t.id === saved) ? saved : teams[0]?.id ?? ''
  })
  const [members, setMembers] = useState<Member[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskCounter, setTaskCounter] = useState(0)

  const team = useMemo(() => teams.find((t) => t.id === teamId) ?? teams[0] ?? null, [teams, teamId])

  const setTeamId = useCallback((id: string) => {
    localStorage.setItem(TEAM_KEY, id)
    setTeamIdState(id)
  }, [])

  const reloadMeta = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const [m, p, s, l] = await Promise.all([
        api<{ members: Member[] }>(`/teams/${teamId}/members`),
        api<{ projects: Project[] }>(`/teams/${teamId}/projects`),
        api<{ statuses: Status[] }>(`/teams/${teamId}/statuses`),
        api<{ labels: Label[] }>(`/teams/${teamId}/labels`),
      ])
      setMembers(m.members)
      setProjects(p.projects)
      setStatuses(s.statuses)
      setLabels(l.labels)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    reloadMeta()
  }, [reloadMeta])

  const openTask = useCallback((id: string) => {
    setEditingTaskId(id)
    setTaskCounter((c) => c + 1)
  }, [])
  const closeTask = useCallback(() => setEditingTaskId(null), [])

  const value = useMemo(
    () => ({
      team,
      teams,
      setTeamId,
      role: team?.role ?? 'member',
      members,
      projects,
      statuses,
      labels,
      loading,
      reloadMeta,
      openTask,
      editingTaskId,
      closeTask,
      taskCounter,
    }),
    [team, teams, setTeamId, members, projects, statuses, labels, loading, reloadMeta, openTask, editingTaskId, closeTask, taskCounter],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

/** Shared helper: label/status/assignee lookup maps for a workspace. */
export function useLookups() {
  const { members, projects, statuses, labels } = useWorkspace()
  return useMemo(
    () => ({
      memberById: new Map(members.map((m) => [m.id, m])),
      projectById: new Map(projects.map((p) => [p.id, p])),
      statusById: new Map(statuses.map((s) => [s.id, s])),
      labelById: new Map(labels.map((l) => [l.id, l])),
    }),
    [members, projects, statuses, labels],
  )
}

export type { Issue }

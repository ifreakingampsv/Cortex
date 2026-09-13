export interface User {
  id: string
  email: string
  name: string
  avatarColor: string
}

export interface Team {
  id: string
  name: string
  slug: string
  created_by?: string
  role: 'admin' | 'member'
}

export interface Member {
  id: string
  email: string
  name: string
  avatarColor: string
  role: 'admin' | 'member'
}

export interface Project {
  id: string
  team_id: string
  name: string
  color: string
  description: string
  archived: number
  openIssues?: number
  doneIssues?: number
}

export interface Status {
  id: string
  team_id: string
  name: string
  category: 'backlog' | 'unstarted' | 'started' | 'completed'
  position: number
}

export interface Label {
  id: string
  team_id: string
  name: string
  color: string
}

export interface LabelRef {
  id: string
  team_id: string
  name: string
  color: string
}

export interface Issue {
  id: string
  team_id: string
  project_id: string | null
  status_id: string
  assignee_id: string | null
  parent_id: string | null
  created_by: string | null
  title: string
  description: string
  estimate_minutes: number
  due_date: string | null
  scheduled_date: string | null
  start_time: string | null
  duration_minutes: number | null
  priority: string
  position: number
  completed_at: string | null
  created_at: string
  updated_at: string
  status_name: string
  status_category: Status['category']
  status_position: number
  project_name: string | null
  project_color: string | null
  assignee_name: string | null
  assignee_color: string | null
  labels: LabelRef[]
  subtasksTotal: number
  subtasksDone: number
  commentCount: number
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at?: string | null
  author_name: string | null
  author_color: string | null
}

export interface Activity {
  id: string
  actor_id: string | null
  actor_name: string | null
  issue_id: string | null
  type: string
  payload: string
  created_at: string
}

export interface CalEvent {
  id: string
  team_id: string
  title: string
  date: string
  start_time: string
  duration_minutes: number
  color: string
}

export interface TimeEntry {
  id: string
  issue_id: string
  user_id: string | null
  user_name?: string | null
  minutes: number
  source: string
  logged_date: string
  created_at: string
}

export interface Highlight {
  id: string
  user_id: string | null
  user_name: string | null
  date: string
  body: string
  created_at: string
}

export interface AnalyticsByDay {
  date: string
  projectId: string
  projectName: string
  color: string
  minutes: number
}

export interface Analytics {
  from: string
  to: string
  byDay: AnalyticsByDay[]
  completed: { id: string; title: string; completed_at: string; project_name: string | null; project_color: string | null }[]
  planned: { date: string; minutes: number }[]
  highlights: Highlight[]
}

export interface IssueDetail {
  issue: Issue
  subtasks: Issue[]
  comments: Comment[]
  activity: Activity[]
  timeEntries: TimeEntry[]
}

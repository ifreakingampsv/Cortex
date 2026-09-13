import { Router } from 'express'
import {
  db, now, uid, localDate, DEFAULT_STATUSES, createTeam,
} from './db.mjs'
import {
  hashPassword, verifyPassword, signToken, publicUser,
  requireAuth, teamContext, requireAdmin, issueContext,
} from './auth.mjs'

export const api = Router()

/* ---------------------------------- helpers ---------------------------------- */

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg })
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function recordActivity(teamId, actorId, issueId, type, payload = {}) {
  db.prepare(
    'INSERT INTO activities (id, team_id, actor_id, issue_id, type, payload, created_at) VALUES (?,?,?,?,?,?,?)',
  ).run(uid(), teamId, actorId, issueId, type, JSON.stringify(payload), now())
}

function issueRowSelect() {
  return `
    SELECT i.*,
      s.name AS status_name, s.category AS status_category, s.position AS status_position,
      p.name AS project_name, p.color AS project_color,
      u.name AS assignee_name, u.avatar_color AS assignee_color
    FROM issues i
    JOIN statuses s ON s.id = i.status_id
    LEFT JOIN projects p ON p.id = i.project_id
    LEFT JOIN users u ON u.id = i.assignee_id
  `
}

function attachIssueMeta(rows) {
  const labelStmt = db.prepare(`
    SELECT l.* FROM issue_labels il JOIN labels l ON l.id = il.label_id
    WHERE il.issue_id = ? ORDER BY l.name`)
  const subStmt = db.prepare(
    'SELECT COUNT(*) AS total, SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS done FROM issues WHERE parent_id = ?')
  const cmtStmt = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE issue_id = ?')
  return rows.map((r) => ({
    ...r,
    labels: labelStmt.all(r.id),
    subtasksTotal: subStmt.get(r.id).total,
    subtasksDone: subStmt.get(r.id).done || 0,
    commentCount: cmtStmt.get(r.id).n,
  }))
}

function nextIssuePosition(teamId, statusId) {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM issues WHERE team_id = ? AND status_id = ?')
    .get(teamId, statusId)
  return row.pos
}

function userTeams(userId) {
  return db.prepare(`
    SELECT t.*, tm.role FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ? ORDER BY t.created_at`).all(userId)
}

/* ----------------------------------- auth ------------------------------------ */

api.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || typeof name !== 'string' || name.trim().length < 1) return bad(res, 'Name is required')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'A valid email is required')
  if (!password || password.length < 8) return bad(res, 'Password must be at least 8 characters')
  const normalized = email.trim().toLowerCase()
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalized)) {
    return bad(res, 'An account with this email already exists', 409)
  }
  const id = uid()
  db.prepare('INSERT INTO users (id, email, password_hash, name, avatar_color, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, normalized, hashPassword(password), name.trim(), '#7C5CFC', now())
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  createTeam({
    name: `${user.name.split(' ')[0]}'s Workspace`,
    slug: `${normalized.split('@')[0].replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 6)}`,
    userId: id,
  })
  // Onboarding issue scheduled for today
  const team = userTeams(id).find((t) => t.created_by === id)
  const firstStatus = db.prepare('SELECT * FROM statuses WHERE team_id = ? ORDER BY position LIMIT 1').get(team.id)
  db.prepare(`INSERT INTO issues (id, team_id, status_id, created_by, title, description, estimate_minutes,
    scheduled_date, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uid(), team.id, firstStatus.id, id, 'Welcome to Cortex 👋',
      'This is your personal workspace. Try planning your day: pick a few tasks, timebox them on the calendar, and run the daily planning ritual.',
      15, localDate(0), 0, now(), now())
  const token = signToken(user)
  res.status(201).json({ token, user: publicUser(user), teams: userTeams(id) })
})

api.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return bad(res, 'Email and password are required')
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase())
  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return bad(res, 'Invalid email or password', 401)
  }
  res.json({ token: signToken(user), user: publicUser(user), teams: userTeams(user.id) })
})

api.post('/auth/demo', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('alex@acme.dev')
  if (!user) return bad(res, 'Demo workspace is not seeded. Run `npm run seed`.', 503)
  res.json({ token: signToken(user), user: publicUser(user), teams: userTeams(user.id) })
})

api.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user), teams: userTeams(req.user.id) })
})

api.patch('/users/me', requireAuth, (req, res) => {
  const { name, avatarColor } = req.body || {}
  if (name !== undefined && (!name || !name.trim())) return bad(res, 'Name cannot be empty')
  db.prepare('UPDATE users SET name = COALESCE(?, name), avatar_color = COALESCE(?, avatar_color) WHERE id = ?')
    .run(name?.trim() ?? null, avatarColor ?? null, req.user.id)
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) })
})

/* ----------------------------------- teams ----------------------------------- */

api.get('/teams', requireAuth, (req, res) => {
  res.json({ teams: userTeams(req.user.id) })
})

api.post('/teams', requireAuth, (req, res) => {
  const { name } = req.body || {}
  if (!name || !name.trim()) return bad(res, 'Team name is required')
  const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uid().slice(0, 6)}`
  const team = createTeam({ name: name.trim(), slug, userId: req.user.id })
  res.status(201).json({ team: { ...team, role: 'admin' } })
})

api.patch('/teams/:id', requireAuth, teamContext, requireAdmin, (req, res) => {
  const { name } = req.body || {}
  if (name !== undefined && !String(name).trim()) return bad(res, 'Team name cannot be empty')
  db.prepare('UPDATE teams SET name = COALESCE(?, name) WHERE id = ?').run(name?.trim() ?? null, req.teamId)
  res.json({ team: { ...db.prepare('SELECT * FROM teams WHERE id = ?').get(req.teamId), role: req.role } })
})

api.get('/teams/:id', requireAuth, teamContext, (req, res) => {
  const counts = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM issues WHERE team_id = ? AND completed_at IS NULL AND parent_id IS NULL) AS openIssues,
      (SELECT COUNT(*) FROM issues WHERE team_id = ? AND completed_at IS NOT NULL AND parent_id IS NULL) AS doneIssues,
      (SELECT COUNT(*) FROM projects WHERE team_id = ? AND archived = 0) AS projects,
      (SELECT COUNT(*) FROM team_members WHERE team_id = ?) AS members
  `).get(req.teamId, req.teamId, req.teamId, req.teamId)
  res.json({ team: { ...req.team, role: req.role }, counts })
})

api.get('/teams/:id/members', requireAuth, teamContext, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.email, u.name, u.avatar_color AS avatarColor, tm.role, tm.user_id IS ? AS isYou
    FROM team_members tm JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ? ORDER BY tm.role DESC, u.name`).all(req.user.id, req.teamId)
  res.json({ members })
})

api.post('/teams/:id/members', requireAuth, teamContext, requireAdmin, (req, res) => {
  const { email, name, role = 'member' } = req.body || {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'A valid email is required')
  if (!['admin', 'member'].includes(role)) return bad(res, 'Invalid role')
  const normalized = email.trim().toLowerCase()
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized)
  if (!user) {
    // Provision the account with a temporary password the invitee can reset via "Recover password".
    const tempPassword = 'welcome1'
    const id = uid()
    db.prepare('INSERT INTO users (id, email, password_hash, name, avatar_color, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, normalized, hashPassword(tempPassword), (name || normalized.split('@')[0]).trim(), '#8B5CF6', now())
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }
  const existing = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(req.teamId, user.id)
  if (existing) return bad(res, 'This person is already a member', 409)
  db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?,?,?)').run(req.teamId, user.id, role)
  recordActivity(req.teamId, req.user.id, null, 'member.added', { email: user.email, role })
  res.status(201).json({ member: { id: user.id, email: user.email, name: user.name, avatarColor: user.avatar_color, role } })
})

api.patch('/teams/:id/members/:userId', requireAuth, teamContext, requireAdmin, (req, res) => {
  const { role } = req.body || {}
  if (!['admin', 'member'].includes(role)) return bad(res, 'Invalid role')
  const member = db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(req.teamId, req.params.userId)
  if (!member) return bad(res, 'Member not found', 404)
  db.prepare('UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?').run(role, req.teamId, req.params.userId)
  res.json({ ok: true })
})

api.delete('/teams/:id/members/:userId', requireAuth, teamContext, requireAdmin, (req, res) => {
  const admins = db.prepare("SELECT COUNT(*) AS n FROM team_members WHERE team_id = ? AND role = 'admin'").get(req.teamId).n
  const target = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(req.teamId, req.params.userId)
  if (!target) return bad(res, 'Member not found', 404)
  if (target.role === 'admin' && admins <= 1) return bad(res, 'Cannot remove the last admin')
  db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(req.teamId, req.params.userId)
  res.json({ ok: true })
})

/* ---------------------------------- projects --------------------------------- */

api.get('/teams/:id/projects', requireAuth, teamContext, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM issues i JOIN statuses s ON s.id = i.status_id
        WHERE i.project_id = p.id AND s.category != 'completed' AND i.parent_id IS NULL) AS openIssues,
      (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id AND i.completed_at IS NOT NULL AND i.parent_id IS NULL) AS doneIssues
    FROM projects p WHERE p.team_id = ? ORDER BY p.created_at`).all(req.teamId)
  res.json({ projects })
})

api.post('/teams/:id/projects', requireAuth, teamContext, (req, res) => {
  const { name, color = '#7C5CFC', description = '' } = req.body || {}
  if (!name || !name.trim()) return bad(res, 'Project name is required')
  const id = uid()
  db.prepare('INSERT INTO projects (id, team_id, name, color, description, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, req.teamId, name.trim(), color, description, now())
  res.status(201).json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(id) })
})

function projectContext(req, res, next) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?')
    .get(project.team_id, req.user.id)
  if (!member) return res.status(404).json({ error: 'Project not found' })
  req.project = project
  req.role = member.role
  next()
}

api.get('/projects/:id', requireAuth, projectContext, (req, res) => {
  res.json({ project: req.project })
})

api.patch('/projects/:id', requireAuth, projectContext, (req, res) => {
  const { name, color, description, archived } = req.body || {}
  if (name !== undefined && !String(name).trim()) return bad(res, 'Project name cannot be empty')
  db.prepare('UPDATE projects SET name = COALESCE(?, name), color = COALESCE(?, color), description = COALESCE(?, description), archived = COALESCE(?, archived) WHERE id = ?')
    .run(name !== undefined ? String(name).trim() : null, color ?? null, description ?? null,
      archived === undefined ? null : archived ? 1 : 0, req.project.id)
  res.json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(req.project.id) })
})

api.delete('/projects/:id', requireAuth, projectContext, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.project.id) // issues get project_id = NULL
  res.json({ ok: true })
})

/* ----------------------------- statuses & labels ----------------------------- */

api.get('/teams/:id/statuses', requireAuth, teamContext, (req, res) => {
  res.json({ statuses: db.prepare('SELECT * FROM statuses WHERE team_id = ? ORDER BY position').all(req.teamId) })
})

api.post('/teams/:id/statuses', requireAuth, teamContext, requireAdmin, (req, res) => {
  const { name, category = 'unstarted' } = req.body || {}
  if (!name || !name.trim()) return bad(res, 'Status name is required')
  if (!['backlog', 'unstarted', 'started', 'completed'].includes(category)) return bad(res, 'Invalid category')
  const pos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM statuses WHERE team_id = ?').get(req.teamId).p
  const id = uid()
  db.prepare('INSERT INTO statuses (id, team_id, name, category, position) VALUES (?,?,?,?,?)')
    .run(id, req.teamId, name.trim(), category, pos)
  res.status(201).json({ status: db.prepare('SELECT * FROM statuses WHERE id = ?').get(id) })
})

api.patch('/statuses/:id', requireAuth, (req, res) => {
  const st = db.prepare('SELECT * FROM statuses WHERE id = ?').get(req.params.id)
  if (!st) return bad(res, 'Status not found', 404)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(st.team_id, req.user.id)
  if (!member) return bad(res, 'Status not found', 404)
  if (member.role !== 'admin') return bad(res, 'Team admin role required', 403)
  const { name, category, position } = req.body || {}
  db.prepare('UPDATE statuses SET name = COALESCE(?, name), category = COALESCE(?, category), position = COALESCE(?, position) WHERE id = ?')
    .run(name?.trim() ?? null, category ?? null, position ?? null, st.id)
  res.json({ status: db.prepare('SELECT * FROM statuses WHERE id = ?').get(st.id) })
})

api.delete('/statuses/:id', requireAuth, (req, res) => {
  const st = db.prepare('SELECT * FROM statuses WHERE id = ?').get(req.params.id)
  if (!st) return bad(res, 'Status not found', 404)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(st.team_id, req.user.id)
  if (!member) return bad(res, 'Status not found', 404)
  if (member.role !== 'admin') return bad(res, 'Team admin role required', 403)
  const used = db.prepare('SELECT COUNT(*) AS n FROM issues WHERE status_id = ?').get(st.id).n
  if (used > 0) return bad(res, `Cannot delete: ${used} issue(s) still use this status`)
  db.prepare('DELETE FROM statuses WHERE id = ?').run(st.id)
  res.json({ ok: true })
})

api.get('/teams/:id/labels', requireAuth, teamContext, (req, res) => {
  res.json({ labels: db.prepare('SELECT * FROM labels WHERE team_id = ? ORDER BY name').all(req.teamId) })
})

api.post('/teams/:id/labels', requireAuth, teamContext, (req, res) => {
  const { name, color = '#7C5CFC' } = req.body || {}
  if (!name || !name.trim()) return bad(res, 'Label name is required')
  const dup = db.prepare('SELECT id FROM labels WHERE team_id = ? AND lower(name) = lower(?)').get(req.teamId, name.trim())
  if (dup) return bad(res, 'A label with this name already exists', 409)
  const id = uid()
  db.prepare('INSERT INTO labels (id, team_id, name, color) VALUES (?,?,?,?)').run(id, req.teamId, name.trim(), color)
  res.status(201).json({ label: db.prepare('SELECT * FROM labels WHERE id = ?').get(id) })
})

api.patch('/labels/:id', requireAuth, (req, res) => {
  const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id)
  if (!label) return bad(res, 'Label not found', 404)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(label.team_id, req.user.id)
  if (!member) return bad(res, 'Label not found', 404)
  const { name, color } = req.body || {}
  db.prepare('UPDATE labels SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?')
    .run(name?.trim() ?? null, color ?? null, label.id)
  res.json({ label: db.prepare('SELECT * FROM labels WHERE id = ?').get(label.id) })
})

api.delete('/labels/:id', requireAuth, (req, res) => {
  const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id)
  if (!label) return bad(res, 'Label not found', 404)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(label.team_id, req.user.id)
  if (!member) return bad(res, 'Label not found', 404)
  db.prepare('DELETE FROM labels WHERE id = ?').run(label.id)
  res.json({ ok: true })
})

/* ----------------------------------- issues ---------------------------------- */

api.get('/issues', requireAuth, (req, res) => {
  const { teamId, projectId, statusId, assigneeId, scheduledFrom, scheduledTo, parentless, completed, search } = req.query
  if (!teamId) return bad(res, 'teamId is required')
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, req.user.id)
  if (!member) return res.status(404).json({ error: 'Team not found' })
  const where = ['i.team_id = ?', 'i.parent_id IS NULL']
  const params = [teamId]
  if (parentless === '1') where.push('i.parent_id IS NULL')
  if (projectId) { where.push('i.project_id = ?'); params.push(projectId) }
  if (statusId) { where.push('i.status_id = ?'); params.push(statusId) }
  if (assigneeId) { where.push('i.assignee_id = ?'); params.push(assigneeId) }
  if (scheduledFrom) { where.push('i.scheduled_date >= ?'); params.push(scheduledFrom) }
  if (scheduledTo) { where.push('i.scheduled_date <= ?'); params.push(scheduledTo) }
  if (completed === '1') { where.push('i.completed_at IS NOT NULL') }
  if (completed === '0') { where.push('i.completed_at IS NULL') }
  if (search) { where.push('lower(i.title) LIKE ?'); params.push(`%${String(search).toLowerCase()}%`) }
  const rows = db.prepare(`${issueRowSelect()} WHERE ${where.join(' AND ')}
    ORDER BY i.position, i.created_at`).all(...params)
  res.json({ issues: attachIssueMeta(rows) })
})

api.post('/issues', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.teamId) return bad(res, 'teamId is required')
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(b.teamId, req.user.id)
  if (!member) return res.status(404).json({ error: 'Team not found' })
  if (!b.title || !String(b.title).trim()) return bad(res, 'Title is required')
  let statusId = b.statusId
  if (!statusId) statusId = db.prepare('SELECT id FROM statuses WHERE team_id = ? ORDER BY position LIMIT 1').get(b.teamId)?.id
  const status = statusId && db.prepare('SELECT * FROM statuses WHERE id = ? AND team_id = ?').get(statusId, b.teamId)
  if (!status) return bad(res, 'Invalid statusId')
  if (b.projectId && !db.prepare('SELECT id FROM projects WHERE id = ? AND team_id = ?').get(b.projectId, b.teamId)) {
    return bad(res, 'Invalid projectId')
  }
  if (b.assigneeId && !db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(b.teamId, b.assigneeId)) {
    return bad(res, 'Assignee is not a member of this team')
  }
  if (b.scheduledDate && !DATE_RE.test(b.scheduledDate)) return bad(res, 'scheduledDate must be YYYY-MM-DD')
  if (b.startTime && !TIME_RE.test(b.startTime)) return bad(res, 'startTime must be HH:MM')
  if (b.parentId) {
    const parent = db.prepare('SELECT * FROM issues WHERE id = ? AND team_id = ?').get(b.parentId, b.teamId)
    if (!parent) return bad(res, 'Invalid parentId')
    if (parent.parent_id) return bad(res, 'Subtasks cannot nest deeper than one level')
  }
  const id = uid()
  const ts = now()
  db.prepare(`INSERT INTO issues (id, team_id, project_id, status_id, assignee_id, parent_id, created_by, title,
    description, estimate_minutes, due_date, scheduled_date, start_time, duration_minutes, position, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.teamId, b.projectId ?? null, statusId, b.assigneeId ?? null, b.parentId ?? null, req.user.id,
      String(b.title).trim(), b.description ?? '', Number(b.estimateMinutes) || 0, b.dueDate ?? null,
      b.scheduledDate ?? null, b.scheduledDate ? (b.startTime ?? null) : null,
      b.scheduledDate ? (Number(b.durationMinutes) || null) : null, nextIssuePosition(b.teamId, statusId), ts, ts)
  recordActivity(b.teamId, req.user.id, id, 'issue.created', { title: String(b.title).trim() })
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(id)
  res.status(201).json({ issue: attachIssueMeta([row])[0] })
})

api.get('/issues/:id', requireAuth, issueContext, (req, res) => {
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(req.issue.id)
  const labels = db.prepare(`
    SELECT l.* FROM issue_labels il JOIN labels l ON l.id = il.label_id WHERE il.issue_id = ? ORDER BY l.name`).all(req.issue.id)
  const subtasks = db.prepare(`${issueRowSelect()} WHERE i.parent_id = ? ORDER BY i.position, i.created_at`).all(req.issue.id)
  const comments = db.prepare(`
    SELECT c.*, u.name AS author_name, u.avatar_color AS author_color
    FROM comments c LEFT JOIN users u ON u.id = c.author_id
    WHERE c.issue_id = ? ORDER BY c.created_at`).all(req.issue.id)
  const activity = db.prepare(`
    SELECT a.*, u.name AS actor_name FROM activities a LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.issue_id = ? ORDER BY a.created_at DESC LIMIT 30`).all(req.issue.id)
  const timeEntries = db.prepare(`
    SELECT te.*, u.name AS user_name FROM time_entries te LEFT JOIN users u ON u.id = te.user_id
    WHERE te.issue_id = ? ORDER BY te.created_at DESC LIMIT 20`).all(req.issue.id)
  res.json({
    issue: { ...attachIssueMeta([row])[0], labels },
    subtasks: attachIssueMeta(subtasks),
    comments,
    activity,
    timeEntries,
  })
})

api.patch('/issues/:id', requireAuth, issueContext, (req, res) => {
  const b = req.body || {}
  const i = req.issue
  const updates = {}
  const acts = []

  if (b.title !== undefined) {
    if (!String(b.title).trim()) return bad(res, 'Title cannot be empty')
    updates.title = String(b.title).trim()
    if (updates.title !== i.title) acts.push(['issue.renamed', { from: i.title, to: updates.title }])
  }
  if (b.description !== undefined) updates.description = String(b.description)
  if (b.estimateMinutes !== undefined) updates.estimate_minutes = Math.max(0, Number(b.estimateMinutes) || 0)
  if (b.dueDate !== undefined) updates.due_date = b.dueDate || null
  if (b.priority !== undefined) updates.priority = String(b.priority)
  if (b.assigneeId !== undefined) {
    if (b.assigneeId && !db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(i.team_id, b.assigneeId)) {
      return bad(res, 'Assignee is not a member of this team')
    }
    updates.assignee_id = b.assigneeId || null
  }
  if (b.projectId !== undefined) {
    if (b.projectId && !db.prepare('SELECT id FROM projects WHERE id = ? AND team_id = ?').get(b.projectId, i.team_id)) {
      return bad(res, 'Invalid projectId')
    }
    updates.project_id = b.projectId || null
  }
  if (b.statusId !== undefined) {
    const status = db.prepare('SELECT * FROM statuses WHERE id = ? AND team_id = ?').get(b.statusId, i.team_id)
    if (!status) return bad(res, 'Invalid statusId')
    if (status.id !== i.status_id) {
      updates.status_id = status.id
      const oldStatus = db.prepare('SELECT * FROM statuses WHERE id = ?').get(i.status_id)
      acts.push(['issue.status_changed', { from: oldStatus.name, to: status.name }])
      updates.completed_at = status.category === 'completed' ? now() : null
      if (status.category === 'completed' && oldStatus.category !== 'completed') {
        acts.push(['issue.completed', { title: i.title }])
      }
    }
  }
  if (b.position !== undefined) updates.position = Number(b.position) || 0
  if (b.parentId !== undefined) return bad(res, 'Move subtasks via their own endpoints')

  const ts = now()
  const sets = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
  if (sets) {
    db.prepare(`UPDATE issues SET ${sets}, updated_at = ? WHERE id = ?`)
      .run(...Object.values(updates), ts, i.id)
  }
  acts.forEach(([type, payload]) => recordActivity(i.team_id, req.user.id, i.id, type, payload))
  if (!sets && acts.length === 0) return res.json({ issue: attachIssueMeta([db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(i.id)])[0] })
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(i.id)
  res.json({ issue: attachIssueMeta([row])[0] })
})

api.delete('/issues/:id', requireAuth, issueContext, (req, res) => {
  db.prepare('DELETE FROM issues WHERE id = ?').run(req.issue.id)
  recordActivity(req.teamId, req.user.id, null, 'issue.deleted', { title: req.issue.title })
  res.json({ ok: true })
})

/* --------------------------- issue labels & subtasks -------------------------- */

api.post('/issues/:id/labels', requireAuth, issueContext, (req, res) => {
  const label = db.prepare('SELECT * FROM labels WHERE id = ? AND team_id = ?').get(req.body?.labelId, req.teamId)
  if (!label) return bad(res, 'Invalid labelId')
  db.prepare('INSERT OR IGNORE INTO issue_labels (issue_id, label_id) VALUES (?,?)').run(req.issue.id, label.id)
  res.json({ labels: db.prepare('SELECT l.* FROM issue_labels il JOIN labels l ON l.id = il.label_id WHERE il.issue_id = ?').all(req.issue.id) })
})

api.delete('/issues/:id/labels/:labelId', requireAuth, issueContext, (req, res) => {
  db.prepare('DELETE FROM issue_labels WHERE issue_id = ? AND label_id = ?').run(req.issue.id, req.params.labelId)
  res.json({ labels: db.prepare('SELECT l.* FROM issue_labels il JOIN labels l ON l.id = il.label_id WHERE il.issue_id = ?').all(req.issue.id) })
})

api.post('/issues/:id/subtasks', requireAuth, issueContext, (req, res) => {
  if (!req.body?.title || !String(req.body.title).trim()) return bad(res, 'Title is required')
  const id = uid()
  const ts = now()
  const pos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM issues WHERE parent_id = ?').get(req.issue.id).p
  db.prepare(`INSERT INTO issues (id, team_id, project_id, status_id, created_by, title, parent_id, position, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.teamId, req.issue.project_id, req.issue.status_id, req.user.id, String(req.body.title).trim(), req.issue.id, pos, ts, ts)
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(id)
  res.status(201).json({ subtask: attachIssueMeta([row])[0] })
})

/* ------------------------------ schedule/timebox ----------------------------- */

api.post('/issues/:id/schedule', requireAuth, issueContext, (req, res) => {
  const b = req.body || {}
  if (!b.scheduledDate || !DATE_RE.test(b.scheduledDate)) return bad(res, 'scheduledDate must be YYYY-MM-DD')
  if (b.startTime && !TIME_RE.test(b.startTime)) return bad(res, 'startTime must be HH:MM')
  const duration = b.durationMinutes === undefined ? req.issue.duration_minutes : Number(b.durationMinutes)
  if (b.startTime && (!duration || duration <= 0)) return bad(res, 'durationMinutes is required when startTime is set')
  db.prepare('UPDATE issues SET scheduled_date = ?, start_time = ?, duration_minutes = ?, updated_at = ? WHERE id = ?')
    .run(b.scheduledDate, b.startTime ?? null, b.startTime ? duration : null, now(), req.issue.id)
  recordActivity(req.teamId, req.user.id, req.issue.id, 'issue.scheduled',
    { date: b.scheduledDate, startTime: b.startTime ?? null, duration })
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(req.issue.id)
  res.json({ issue: attachIssueMeta([row])[0] })
})

api.post('/issues/:id/unschedule', requireAuth, issueContext, (req, res) => {
  db.prepare('UPDATE issues SET scheduled_date = NULL, start_time = NULL, duration_minutes = NULL, updated_at = ? WHERE id = ?')
    .run(now(), req.issue.id)
  recordActivity(req.teamId, req.user.id, req.issue.id, 'issue.unscheduled', {})
  const row = db.prepare(`${issueRowSelect()} WHERE i.id = ?`).get(req.issue.id)
  res.json({ issue: attachIssueMeta([row])[0] })
})

/* ---------------------------------- comments --------------------------------- */

api.post('/issues/:id/comments', requireAuth, issueContext, (req, res) => {
  const { body } = req.body || {}
  if (!body || !String(body).trim()) return bad(res, 'Comment body is required')
  const id = uid()
  db.prepare('INSERT INTO comments (id, issue_id, author_id, body, created_at) VALUES (?,?,?,?,?)')
    .run(id, req.issue.id, req.user.id, String(body).trim(), now())
  recordActivity(req.teamId, req.user.id, req.issue.id, 'comment.added', {})
  const comment = db.prepare(`
    SELECT c.*, u.name AS author_name, u.avatar_color AS author_color
    FROM comments c LEFT JOIN users u ON u.id = c.author_id WHERE c.id = ?`).get(id)
  res.status(201).json({ comment })
})

function commentContext(req, res, next) {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(comment.issue_id)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(issue.team_id, req.user.id)
  if (!member) return res.status(404).json({ error: 'Comment not found' })
  req.comment = comment
  req.role = member.role
  next()
}

api.patch('/comments/:id', requireAuth, commentContext, (req, res) => {
  if (req.comment.author_id !== req.user.id) return bad(res, 'Only the author can edit this comment', 403)
  const { body } = req.body || {}
  if (!body || !String(body).trim()) return bad(res, 'Comment body is required')
  db.prepare('UPDATE comments SET body = ?, updated_at = ? WHERE id = ?').run(String(body).trim(), now(), req.comment.id)
  res.json({ comment: db.prepare('SELECT * FROM comments WHERE id = ?').get(req.comment.id) })
})

api.delete('/comments/:id', requireAuth, commentContext, (req, res) => {
  if (req.comment.author_id !== req.user.id && req.role !== 'admin') {
    return bad(res, 'Only the author or a team admin can delete this comment', 403)
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.comment.id)
  res.json({ ok: true })
})

/* ------------------------------ events & timebox ----------------------------- */

api.get('/teams/:id/events', requireAuth, teamContext, (req, res) => {
  const { from, to } = req.query
  let sql = 'SELECT * FROM events WHERE team_id = ?'
  const params = [req.teamId]
  if (from) { sql += ' AND date >= ?'; params.push(from) }
  if (to) { sql += ' AND date <= ?'; params.push(to) }
  res.json({ events: db.prepare(`${sql} ORDER BY date, start_time`).all(...params) })
})

api.post('/teams/:id/events', requireAuth, teamContext, (req, res) => {
  const b = req.body || {}
  if (!b.title || !String(b.title).trim()) return bad(res, 'Title is required')
  if (!b.date || !DATE_RE.test(b.date)) return bad(res, 'date must be YYYY-MM-DD')
  if (!b.startTime || !TIME_RE.test(b.startTime)) return bad(res, 'startTime must be HH:MM')
  const duration = Number(b.durationMinutes)
  if (!duration || duration <= 0) return bad(res, 'durationMinutes must be positive')
  const id = uid()
  db.prepare('INSERT INTO events (id, team_id, created_by, title, date, start_time, duration_minutes, color, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, req.teamId, req.user.id, String(b.title).trim(), b.date, b.startTime, duration, b.color || 'blue', now())
  res.status(201).json({ event: db.prepare('SELECT * FROM events WHERE id = ?').get(id) })
})

api.delete('/events/:id', requireAuth, (req, res) => {
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!ev) return bad(res, 'Event not found', 404)
  const member = db.prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?').get(ev.team_id, req.user.id)
  if (!member) return bad(res, 'Event not found', 404)
  db.prepare('DELETE FROM events WHERE id = ?').run(ev.id)
  res.json({ ok: true })
})

/* ------------------------------- time entries -------------------------------- */

api.post('/issues/:id/time-entries', requireAuth, issueContext, (req, res) => {
  const minutes = Number(req.body?.minutes)
  if (!minutes || minutes <= 0) return bad(res, 'minutes must be a positive number')
  const id = uid()
  db.prepare('INSERT INTO time_entries (id, issue_id, user_id, minutes, source, logged_date, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.issue.id, req.user.id, Math.round(minutes), req.body?.source === 'manual' ? 'manual' : 'focus', localDate(0), now())
  const total = db.prepare('SELECT COALESCE(SUM(minutes),0) AS m FROM time_entries WHERE issue_id = ?').get(req.issue.id).m
  res.status(201).json({ timeEntry: db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id), issueTotalMinutes: total })
})

/* --------------------------------- analytics --------------------------------- */

api.get('/teams/:id/analytics', requireAuth, teamContext, (req, res) => {
  const from = req.query.from || localDate(-6)
  const to = req.query.to || localDate(0)
  const rows = db.prepare(`
    SELECT te.logged_date AS date, COALESCE(i.project_id, 'none') AS projectId,
      COALESCE(p.name, 'No project') AS projectName, COALESCE(p.color, '#A8A29E') AS color,
      SUM(te.minutes) AS minutes
    FROM time_entries te
    LEFT JOIN issues i ON i.id = te.issue_id
    LEFT JOIN projects p ON p.id = i.project_id
    WHERE te.logged_date BETWEEN ? AND ?
      AND (i.team_id = ? OR i.team_id IS NULL)
    GROUP BY te.logged_date, projectId ORDER BY te.logged_date`).all(from, to, req.teamId)
  const completed = db.prepare(`
    SELECT i.id, i.title, i.completed_at, p.name AS project_name, p.color AS project_color
    FROM issues i LEFT JOIN projects p ON p.id = i.project_id
    WHERE i.team_id = ? AND i.completed_at IS NOT NULL AND date(i.completed_at) BETWEEN ? AND ?
      AND i.parent_id IS NULL
    ORDER BY i.completed_at DESC`).all(req.teamId, from, to)
  const planned = db.prepare(`
    SELECT scheduled_date AS date, SUM(COALESCE(duration_minutes, estimate_minutes, 0)) AS minutes
    FROM issues WHERE team_id = ? AND scheduled_date BETWEEN ? AND ? AND parent_id IS NULL
    GROUP BY scheduled_date`).all(req.teamId, from, to)
  const highlights = db.prepare(`
    SELECT h.*, u.name AS user_name FROM highlights h LEFT JOIN users u ON u.id = h.user_id
    WHERE h.team_id = ? AND h.date BETWEEN ? AND ? ORDER BY h.date, h.created_at`).all(req.teamId, from, to)
  res.json({ from, to, byDay: rows, completed, planned, highlights })
})

/* --------------------------------- highlights -------------------------------- */

api.get('/teams/:id/highlights', requireAuth, teamContext, (req, res) => {
  const { date } = req.query
  let sql = `SELECT h.*, u.name AS user_name FROM highlights h LEFT JOIN users u ON u.id = h.user_id WHERE h.team_id = ?`
  const params = [req.teamId]
  if (date) { sql += ' AND h.date = ?'; params.push(date) }
  res.json({ highlights: db.prepare(`${sql} ORDER BY h.date DESC, h.created_at`).all(...params) })
})

api.post('/teams/:id/highlights', requireAuth, teamContext, (req, res) => {
  const { body } = req.body || {}
  if (!body || !String(body).trim()) return bad(res, 'Highlight text is required')
  const date = req.body?.date || localDate(0)
  if (!DATE_RE.test(date)) return bad(res, 'date must be YYYY-MM-DD')
  const id = uid()
  db.prepare('INSERT INTO highlights (id, team_id, user_id, date, body, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, req.teamId, req.user.id, date, String(body).trim(), now())
  res.status(201).json({ highlight: { ...db.prepare('SELECT * FROM highlights WHERE id = ?').get(id), user_name: req.user.name } })
})

/* ---------------------------------- health ----------------------------------- */

api.get('/health', (req, res) => {
  const counts = {
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    teams: db.prepare('SELECT COUNT(*) AS n FROM teams').get().n,
    issues: db.prepare('SELECT COUNT(*) AS n FROM issues').get().n,
  }
  res.json({ ok: true, counts, time: now() })
})

api.use((req, res) => res.status(404).json({ error: `No such endpoint: ${req.method} ${req.path}` }))

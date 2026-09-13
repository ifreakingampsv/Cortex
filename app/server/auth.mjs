import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.mjs'

export const JWT_SECRET = process.env.JWT_SECRET || 'cortex-dev-secret'
const TOKEN_TTL = '7d'

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash)
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function publicUser(u) {
  if (!u) return null
  return { id: u.id, email: u.email, name: u.name, avatarColor: u.avatar_color }
}

/** Express middleware: requires `Authorization: Bearer <jwt>`. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    if (!user) return res.status(401).json({ error: 'User no longer exists' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Resolves `:id` (or `:teamId`) to the team and the caller's membership role.
 * Non-members get a 404 so team existence is not leaked.
 */
export function teamContext(req, res, next) {
  const teamId = req.params.id || req.params.teamId || req.body?.teamId || req.query?.teamId
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })
  const member = db
    .prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?')
    .get(teamId, req.user.id)
  if (!member) return res.status(404).json({ error: 'Team not found' })
  req.team = team
  req.teamId = teamId
  req.role = member.role
  next()
}

export function requireAdmin(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Team admin role required' })
  next()
}

/** Resolves req.issue (and team membership) for routes addressing /issues/:id. */
export function issueContext(req, res, next) {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id)
  if (!issue) return res.status(404).json({ error: 'Issue not found' })
  const member = db
    .prepare('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?')
    .get(issue.team_id, req.user.id)
  if (!member) return res.status(404).json({ error: 'Issue not found' })
  req.issue = issue
  req.teamId = issue.team_id
  req.role = member.role
  next()
}

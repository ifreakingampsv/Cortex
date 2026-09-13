/**
 * Seed the database with a realistic demo workspace (Acme Inc).
 * Idempotent: wipes known tables, then re-creates the demo world.
 * All demo passwords: "demo1234". Demo login: alex@acme.dev / demo1234
 */
import { db, now, uid, localDate, DEFAULT_LABELS } from './db.mjs'
import { hashPassword } from './auth.mjs'

const wipe = db.transaction(() => {
  const tables = [
    'activities', 'highlights', 'time_entries', 'events', 'comments',
    'issue_labels', 'issues', 'labels', 'statuses', 'projects',
    'team_members', 'teams', 'users',
  ]
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run()
})
wipe()

const insUser = db.prepare('INSERT INTO users (id, email, password_hash, name, avatar_color, created_at) VALUES (?,?,?,?,?,?)')
const insTeam = db.prepare('INSERT INTO teams (id, name, slug, created_by, created_at) VALUES (?,?,?,?,?)')
const insMember = db.prepare('INSERT INTO team_members (team_id, user_id, role) VALUES (?,?,?)')
const insProject = db.prepare('INSERT INTO projects (id, team_id, name, color, description, created_at) VALUES (?,?,?,?,?,?)')
const insStatus = db.prepare('INSERT INTO statuses (id, team_id, name, category, position) VALUES (?,?,?,?,?)')
const insLabel = db.prepare('INSERT INTO labels (id, team_id, name, color) VALUES (?,?,?,?)')
const insIssue = db.prepare(`INSERT INTO issues (id, team_id, project_id, status_id, assignee_id, parent_id, created_by,
  title, description, estimate_minutes, due_date, scheduled_date, start_time, duration_minutes, position, completed_at,
  created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
const insIL = db.prepare('INSERT INTO issue_labels (issue_id, label_id) VALUES (?,?)')
const insComment = db.prepare('INSERT INTO comments (id, issue_id, author_id, body, created_at) VALUES (?,?,?,?,?)')
const insEvent = db.prepare('INSERT INTO events (id, team_id, created_by, title, date, start_time, duration_minutes, color, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
const insTime = db.prepare('INSERT INTO time_entries (id, issue_id, user_id, minutes, source, logged_date, created_at) VALUES (?,?,?,?,?,?,?)')
const insHighlight = db.prepare('INSERT INTO highlights (id, team_id, user_id, date, body, created_at) VALUES (?,?,?,?,?,?)')
const insActivity = db.prepare('INSERT INTO activities (id, team_id, actor_id, issue_id, type, payload, created_at) VALUES (?,?,?,?,?,?,?)')

const PASSWORD = hashPassword('demo1234')
const ts = now()

/* ------------------------------- users & team -------------------------------- */

const users = {
  alex: { id: uid(), email: 'alex@acme.dev', name: 'Alex Rivera', color: '#7C5CFC' },
  sarah: { id: uid(), email: 'sarah@acme.dev', name: 'Sarah Chen', color: '#38BDF8' },
  tom: { id: uid(), email: 'tom@acme.dev', name: 'Tom Okafor', color: '#22D3EE' },
  mia: { id: uid(), email: 'mia@acme.dev', name: 'Mia Petrov', color: '#F471B5' },
  dev: { id: uid(), email: 'dev@acme.dev', name: 'Dev Green', color: '#22C55E' },
}
for (const u of Object.values(users)) {
  insUser.run(u.id, u.email, PASSWORD, u.name, u.color, ts)
}

const teamId = uid()
insTeam.run(teamId, 'Acme Inc', 'acme', users.alex.id, ts)
insMember.run(teamId, users.alex.id, 'admin')
for (const u of [users.sarah, users.tom, users.mia, users.dev]) insMember.run(teamId, u.id, 'member')

/* -------------------------------- projects ----------------------------------- */

const projects = {
  website: { id: uid(), name: 'Website Redesign', color: '#EC4899', description: 'Marketing site refresh: new brand, faster pages, better conversion.' },
  mobile: { id: uid(), name: 'Mobile App', color: '#A78BFA', description: 'React Native app — planner, calendar sync and offline mode.' },
  growth: { id: uid(), name: 'Growth Experiments', color: '#38BDF8', description: 'Onboarding, lifecycle emails and pricing page experiments.' },
}
for (const p of Object.values(projects)) insProject.run(p.id, teamId, p.name, p.color, p.description, ts)

/* --------------------------------- statuses ---------------------------------- */

const statuses = {}
;[
  ['Backlog', 'backlog'],
  ['Up Next', 'unstarted'],
  ['In Progress', 'started'],
  ['Done', 'completed'],
].forEach(([name, category], i) => {
  const id = uid()
  statuses[name] = { id, category }
  insStatus.run(id, teamId, name, category, i)
})

/* ---------------------------------- labels ----------------------------------- */

const labels = {}
;[
  ...DEFAULT_LABELS,
  { name: 'planning', color: '#38BDF8' },
  { name: 'bug', color: '#EF4444' },
  { name: 'research', color: '#14B8A6' },
].forEach((l) => {
  const id = uid()
  labels[l.name] = { id, color: l.color }
  insLabel.run(id, teamId, l.name, l.color)
})

/* ---------------------------------- issues ----------------------------------- */
// Helper: minutes label used across the UI is "1:30" style.

let pos = { [statuses.Backlog.id]: 0, [statuses['Up Next'].id]: 0, [statuses['In Progress'].id]: 0, [statuses.Done.id]: 0 }
const issues = {}

function addIssue(key, fields, labelNames = []) {
  const id = uid()
  const status = statuses[fields.status]
  insIssue.run(
    id, teamId, fields.project?.id ?? null, status.id, fields.assignee?.id ?? null, fields.parent ?? null,
    fields.createdBy?.id ?? users.alex.id, fields.title, fields.description ?? '',
    fields.estimate ?? 0, fields.due ?? null, fields.scheduled ?? null, fields.startTime ?? null,
    fields.duration ?? null, pos[status.id]++, fields.status === 'Done' ? (fields.completedAt ?? ts) : null,
    fields.createdAt ?? ts, ts,
  )
  for (const l of labelNames) insIL.run(id, labels[l].id)
  issues[key] = { id, ...fields }
  return id
}

/* Scheduled for today — the day the demo user opens the app */
addIssue('todayNotes', {
  status: 'In Progress', project: projects.website, assignee: users.alex, title: 'Build daily notes feature',
  description: 'Ship the daily notes editor with markdown support and AI summary hook. Split out of the planning epic.',
  estimate: 60, scheduled: localDate(0), startTime: '09:00', duration: 60, createdBy: users.sarah,
}, ['product', 'planning'])
addIssue('todayFeedback', {
  status: 'Up Next', project: projects.website, assignee: users.alex, title: 'Document customer feedback',
  description: 'Summarize churn survey results, review top posts in the community, and file follow-ups.',
  estimate: 90, scheduled: localDate(0), startTime: '10:30', duration: 90, createdBy: users.mia,
}, ['product'])
addIssue('todayDemo', {
  status: 'Up Next', project: projects.growth, assignee: users.alex, title: 'Product demo with Jenn',
  description: 'Walk Jenn through the new planner flow. Prep: reset her sandbox workspace.',
  estimate: 90, scheduled: localDate(0), startTime: '13:30', duration: 90, createdBy: users.alex,
}, ['growth'])
addIssue('todayGrowth', {
  status: 'Up Next', project: projects.growth, assignee: users.sarah, title: 'Investigate secondary growth channels',
  estimate: 60, scheduled: localDate(0), startTime: '15:30', duration: 60, createdBy: users.alex,
}, ['growth', 'research'])
addIssue('todayTomoka', {
  status: 'Up Next', project: projects.mobile, assignee: users.tom, title: '1:1 with Tomoka',
  estimate: 30, scheduled: localDate(0), startTime: '11:00', duration: 30, createdBy: users.tom,
}, ['planning'])

/* Scheduled for tomorrow */
addIssue('tomTickets', {
  status: 'Backlog', project: projects.website, assignee: users.alex, title: 'Answer customer support tickets',
  description: 'Clear the support inbox, focus on billing questions first.',
  estimate: 30, scheduled: localDate(1), startTime: '09:00', duration: 30,
}, ['product'])
addIssue('tomPrototype', {
  status: 'Backlog', project: projects.mobile, assignee: users.alex, title: 'Review prototype of new feature',
  estimate: 120, scheduled: localDate(1), startTime: '10:00', duration: 120, createdBy: users.mia,
}, ['design', 'product'])
addIssue('tomPlanning', {
  status: 'Backlog', project: projects.growth, assignee: users.sarah, title: 'Investigate secondary growth channels',
  estimate: 60, scheduled: localDate(1), startTime: '14:00', duration: 60,
}, ['planning', 'growth'])

/* In progress / up next (unscheduled) */
addIssue('onboarding', {
  status: 'In Progress', project: projects.growth, assignee: users.mia, title: 'Rework onboarding email sequence',
  description: 'Five-step drip replacing the single welcome email. Draft copy, then wire up the automation.',
  estimate: 180, due: localDate(4),
}, ['growth'])
addIssue('pushNotifs', {
  status: 'In Progress', project: projects.mobile, assignee: users.tom, title: 'Push notification scheduler',
  estimate: 240, due: localDate(6),
}, ['product'])
addIssue('pricing', {
  status: 'Up Next', project: projects.growth, assignee: users.alex, title: 'Pricing page A/B test',
  estimate: 90,
}, ['growth'])
addIssue('calClient', {
  status: 'Up Next', project: projects.website, assignee: users.dev, title: 'Extract client from spreadsheet data',
  estimate: 45,
}, ['product'])
addIssue('darkMode', {
  status: 'Up Next', project: projects.mobile, assignee: users.sarah, title: 'Dark mode audit',
  estimate: 120,
}, ['design'])

/* Backlog */
addIssue('slackInt', { status: 'Backlog', project: projects.mobile, assignee: null, title: 'Slack integration v2', estimate: 300 }, ['product'])
addIssue('offline', { status: 'Backlog', project: projects.mobile, assignee: users.tom, title: 'Offline mode research', estimate: 180 }, ['research'])
addIssue('churn', { status: 'Backlog', project: projects.growth, assignee: users.mia, title: 'Churn survey synthesis', estimate: 60 }, ['research', 'growth'])
addIssue('brand', { status: 'Backlog', project: projects.website, assignee: users.dev, title: 'Brand illustration set', estimate: 240 }, ['design'])
addIssue('sitemap', { status: 'Backlog', project: projects.website, assignee: null, title: 'Sitemap and IA cleanup', estimate: 90 }, ['product'])
addIssue('sso', { status: 'Backlog', project: projects.mobile, assignee: users.sarah, title: 'SAML SSO spike', estimate: 240 }, ['product', 'research'])
addIssue('lighthouse', { status: 'Backlog', project: projects.website, assignee: users.dev, title: 'Fix Lighthouse regressions on /pricing', estimate: 60 }, ['bug'])
addIssue('weekly', { status: 'Backlog', project: projects.growth, assignee: users.alex, title: 'Weekly metrics review automation', estimate: 120 }, ['planning'])

/* Completed earlier this week (feed the analytics chart) */
addIssue('doneSurvey', {
  status: 'Done', project: projects.growth, assignee: users.alex, title: 'Send churn survey to 2,400 users',
  estimate: 45, completedAt: `${localDate(-1)}T16:12:00.000Z`, createdAt: `${localDate(-2)}T09:00:00.000Z`,
}, ['growth'])
addIssue('doneFix', {
  status: 'Done', project: projects.mobile, assignee: users.sarah, title: 'Investigate save issue on Android',
  estimate: 60, completedAt: `${localDate(-1)}T18:40:00.000Z`, createdAt: `${localDate(-1)}T09:00:00.000Z`,
}, ['bug'])
addIssue('doneReviews', {
  status: 'Done', project: projects.growth, assignee: users.mia, title: 'Weekly team reviews and reports',
  estimate: 90, completedAt: `${localDate(-1)}T17:05:00.000Z`, createdAt: `${localDate(-2)}T10:00:00.000Z`,
}, ['planning'])
addIssue('doneLaunch', {
  status: 'Done', project: projects.website, assignee: users.dev, title: 'Beta launch checklist',
  estimate: 120, completedAt: `${localDate(-2)}T15:30:00.000Z`, createdAt: `${localDate(-3)}T09:00:00.000Z`,
}, ['product'])

/* Subtasks */
function addSubtask(parentKey, title, done = false) {
  const parent = issues[parentKey]
  const id = uid()
  insIssue.run(id, teamId, parent.project?.id ?? null, statuses[parent.status].id, parent.assignee?.id ?? users.alex.id,
    parent.id, users.alex.id, title, '', 0, null, null, null, null, 0, done ? ts : null, ts, ts)
}
addSubtask('todayFeedback', 'Summarize customer churn surveys', true)
addSubtask('todayFeedback', 'Review top posts in community', true)
addSubtask('todayFeedback', 'File follow-up tickets', false)
addSubtask('todayNotes', 'Basic data model', true)
addSubtask('todayNotes', 'Rich text editor spike', false)
addSubtask('todayNotes', 'Save + sync hook', false)
addSubtask('onboarding', 'Draft email copy', true)
addSubtask('onboarding', 'Set up automation triggers', false)
addSubtask('doneSurvey', 'Pick survey tool', true)
addSubtask('doneSurvey', 'Import user list', true)

/* --------------------------------- comments ---------------------------------- */

insComment.run(uid(), issues.todayNotes.id, users.sarah.id,
  'Heads up: the editor spike is in `feat/daily-notes` — the sync hook depends on the new schema.', `${localDate(0)}T08:14:00.000Z`)
insComment.run(uid(), issues.todayNotes.id, users.alex.id,
  'Thanks! I will rebase on it this morning and keep the summary feature behind a flag.', `${localDate(0)}T08:31:00.000Z`)
insComment.run(uid(), issues.todayDemo.id, users.mia.id,
  'Jenn asked if the demo can include the calendar sync — added it to the agenda doc.', `${localDate(-1)}T17:45:00.000Z`)
insComment.run(uid(), issues.churn.id, users.dev.id,
  'I have a small query that buckets responses by plan — say the word and I will run it.', `${localDate(-2)}T11:02:00.000Z`)
insComment.run(uid(), issues.doneFix.id, users.sarah.id,
  'Root cause: a client-caching bug in the sync layer. Fix shipped in 2.4.1.', `${localDate(-1)}T18:35:00.000Z`)

/* ------------------------------- calendar events ------------------------------ */

function addEvent(title, date, startTime, duration, color) {
  insEvent.run(uid(), teamId, users.alex.id, title, date, startTime, duration, color, ts)
}
addEvent('Morning routine', localDate(0), '07:00', 20, 'blue')
addEvent('Team standup', localDate(0), '09:30', 15, 'green')
addEvent('Lunch', localDate(0), '12:00', 60, 'blue')
addEvent('Product demo with Jenn', localDate(0), '13:30', 90, 'purple')
addEvent('Morning routine', localDate(1), '07:00', 20, 'blue')
addEvent('Sprint planning', localDate(1), '09:30', 45, 'green')
addEvent('Lunch', localDate(1), '12:00', 60, 'blue')
addEvent('Design review', localDate(1), '15:00', 45, 'purple')
addEvent('Delphia sync', localDate(2), '08:00', 30, 'blue')
addEvent('All-hands', localDate(3), '16:00', 30, 'amber')

/* --------------------------- time entries & highlights ------------------------ */

function logTime(issueKey, userId, minutes, daysAgo, source = 'focus') {
  insTime.run(uid(), issues[issueKey].id, userId, minutes, source, localDate(-daysAgo), `${localDate(-daysAgo)}T18:00:00.000Z`)
}
logTime('todayNotes', users.alex.id, 45, 0, 'focus')
logTime('doneSurvey', users.alex.id, 45, 1, 'focus')
logTime('doneSurvey', users.mia.id, 30, 1, 'manual')
logTime('doneFix', users.sarah.id, 75, 1, 'focus')
logTime('doneReviews', users.mia.id, 90, 1, 'focus')
logTime('doneLaunch', users.dev.id, 120, 2, 'focus')
logTime('doneLaunch', users.alex.id, 60, 2, 'focus')
logTime('doneFix', users.tom.id, 45, 3, 'focus')
logTime('todayFeedback', users.alex.id, 30, 3, 'manual')
logTime('pushNotifs', users.tom.id, 90, 4, 'focus')
logTime('onboarding', users.mia.id, 60, 5, 'focus')
logTime('darkMode', users.sarah.id, 45, 6, 'focus')

insHighlight.run(uid(), teamId, users.alex.id, localDate(-1),
  'Today was great. After the meeting, I got focused, investigated and fixed the save issue, and knocked out some reviews. We should be ready to launch!', `${localDate(-1)}T17:30:00.000Z`)
insHighlight.run(uid(), teamId, users.sarah.id, localDate(-1),
  'Shipped the sync-layer fix and reviewed the notes schema. Clean stop at 6.', `${localDate(-1)}T17:32:00.000Z`)
insHighlight.run(uid(), teamId, users.alex.id, localDate(-2),
  'Beta launch checklist done. Decided that we will need to prioritize a beta launch review next week.', `${localDate(-2)}T17:10:00.000Z`)

/* -------------------------------- activities ---------------------------------- */

insActivity.run(uid(), teamId, users.alex.id, issues.todayNotes.id, 'issue.created', JSON.stringify({ title: 'Build daily notes feature' }), `${localDate(-2)}T09:00:00.000Z`)
insActivity.run(uid(), teamId, users.sarah.id, issues.todayNotes.id, 'issue.status_changed', JSON.stringify({ from: 'Up Next', to: 'In Progress' }), `${localDate(-1)}T10:00:00.000Z`)
insActivity.run(uid(), teamId, users.alex.id, issues.todayFeedback.id, 'issue.scheduled', JSON.stringify({ date: localDate(0), startTime: '10:30', duration: 90 }), `${localDate(-1)}T17:45:00.000Z`)
insActivity.run(uid(), teamId, users.mia.id, issues.doneReviews.id, 'issue.completed', JSON.stringify({ title: 'Weekly team reviews and reports' }), `${localDate(-1)}T17:05:00.000Z`)

/* --------------------------------- second team -------------------------------- */
// A second workspace for the demo user, to prove the team switcher works.
const team2Id = uid()
insTeam.run(team2Id, 'Side Projects', 'side-projects', users.alex.id, ts)
insMember.run(team2Id, users.alex.id, 'admin')
insStatus.run(uid(), team2Id, 'Backlog', 'backlog', 0)
insStatus.run(uid(), team2Id, 'In Progress', 'started', 1)
insStatus.run(uid(), team2Id, 'Done', 'completed', 2)
insLabel.run(uid(), team2Id, 'personal', '#22C55E')
insProject.run(uid(), team2Id, 'Home Studio', '#0EA5E9', 'Building a small music corner.', ts)
const st2 = db.prepare('SELECT id FROM statuses WHERE team_id = ? ORDER BY position LIMIT 1').get(team2Id).id
insIssue.run(uid(), team2Id, null, st2, users.alex.id, null, users.alex.id, 'Pick acoustic panels', 'Compare bass traps vs broadband absorbers.', 60, null, localDate(1), '18:00', 60, 0, null, ts, ts)

/* ---------------------------------- summary ----------------------------------- */

const counts = {
  users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
  teams: db.prepare('SELECT COUNT(*) n FROM teams').get().n,
  projects: db.prepare('SELECT COUNT(*) n FROM projects').get().n,
  issues: db.prepare('SELECT COUNT(*) n FROM issues').get().n,
  comments: db.prepare('SELECT COUNT(*) n FROM comments').get().n,
  events: db.prepare('SELECT COUNT(*) n FROM events').get().n,
  timeEntries: db.prepare('SELECT COUNT(*) n FROM time_entries').get().n,
  highlights: db.prepare('SELECT COUNT(*) n FROM highlights').get().n,
}
console.log('Seed complete:', JSON.stringify(counts))
console.log('Demo login: alex@acme.dev / demo1234  (all seeded users share password demo1234)')

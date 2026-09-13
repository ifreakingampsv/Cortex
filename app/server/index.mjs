import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { api } from './routes.mjs'
import { db } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(express.json({ limit: '1mb' }))

// Auto-seed an empty database so `npm start` works out of the box.
const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
if (userCount === 0) {
  console.log('[server] empty database detected — seeding demo workspace…')
  await import('./seed.mjs')
}

app.use('/api', api)

const dist = path.join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  // SPA fallback for client-side routes (/login, /app, ...)
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

// JSON error handler (bad JSON bodies, unexpected failures)
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' })
  console.error('[server] error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[server] Cortex running on http://localhost:${PORT}`)
})

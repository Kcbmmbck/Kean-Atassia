import cookieSession from 'cookie-session'
import express, { type NextFunction, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { anniversaryContent } from './content.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)
const sessionSecret = process.env.SESSION_SECRET
const pin = process.env.ANNIVERSARY_PIN
const production = process.env.NODE_ENV === 'production'
const unlockAt = Date.parse('2027-08-13T00:00:00+08:00')
const here = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'anniversary-uploads')
  : path.join(here, 'private', 'uploads')

if (production && (!sessionSecret || sessionSecret.length < 32 || !pin)) {
  throw new Error('Production requires SESSION_SECRET (32+ characters) and ANNIVERSARY_PIN.')
}

app.set('trust proxy', production ? 1 : false)
app.use(express.json({ limit: '1mb' }))
app.use(cookieSession({
  name: 'anniversary-session',
  keys: [sessionSecret ?? 'development-only-change-this-session-secret'],
  httpOnly: true,
  sameSite: 'strict',
  secure: production,
  maxAge: 1000 * 60 * 60 * 12,
}))

const requireUnlock = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.unlocked === true) return next()
  res.status(401).json({ error: 'Unlock our story to continue.' })
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many tries. Take a little break and try again soon.' },
})

app.get('/api/session', (req, res) => res.json({ unlocked: req.session?.unlocked === true }))

app.post('/api/unlock', loginLimiter, (req, res) => {
  if (production && Date.now() < unlockAt) {
    res.status(423).json({ error: 'Our love story is still counting down. Come back on August 13, 2027.' })
    return
  }
  const submitted = req.body?.pin
  if (typeof submitted !== 'string' || submitted.length !== 4 || !/^\d{4}$/.test(submitted)) {
    res.status(400).json({ error: 'Please enter all four digits.' })
    return
  }
  const configuredPin = pin ?? '0813'
  const expected = createHash('sha256').update(configuredPin).digest()
  const candidate = createHash('sha256').update(submitted).digest()
  if (!timingSafeEqual(expected, candidate)) {
    res.status(401).json({ error: 'Not quite, baby. Give it another try 💗' })
    return
  }
  req.session = { unlocked: true }
  res.json({ unlocked: true })
})

app.post('/api/lock', (req, res) => {
  req.session = null
  res.status(204).end()
})

app.get('/api/content', requireUnlock, (_req, res) => res.json(anniversaryContent))

await mkdir(uploadsDir, { recursive: true })
class InvalidImageError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      callback(null, `${Date.now()}-${cryptoRandomId()}${extension}`)
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      callback(new InvalidImageError('Please choose a JPG, PNG, WebP, or GIF image.'))
      return
    }
    callback(null, true)
  },
})

app.post('/api/uploads', requireUnlock, upload.array('photos', 10), (req, res) => {
  const files = req.files as Express.Multer.File[]
  res.status(201).json({ files: files.map(file => ({ name: file.originalname, url: `/api/media/${encodeURIComponent(file.filename)}` })) })
})

app.get('/api/media/:name', requireUnlock, async (req, res, next) => {
  const name = path.basename(String(req.params.name))
  const filePath = path.join(uploadsDir, name)
  try {
    await stat(filePath)
    res.sendFile(filePath)
  } catch (error) {
    next(error)
  }
})

function cryptoRandomId() {
  return randomUUID()
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError || error instanceof InvalidImageError) {
    res.status(400).json({ error: error.message })
    return
  }
  console.error('Unexpected request error:', error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

if (production && !process.env.VERCEL) {
  const distDir = path.resolve(here, '../dist')
  app.use(express.static(distDir))
  app.get('*path', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Anniversary app server listening on port ${port}`))
}

export default app

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Heart, LockKeyhole, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import { CountdownMusic, LoadingScreen, PageShell, PageTransition, SiteHeader } from './components'
import type { AnniversaryContent, Memory } from './types'

const anniversary = new Date('2027-08-13T00:00:00+08:00')
const photoAssets = Object.entries(import.meta.glob<string>('./media/img/*.jpeg', { eager: true, import: 'default', query: '?url' }))
  .sort(([left], [right]) => right.localeCompare(left, undefined, { numeric: true }))
const puzzleAssets = Object.values(import.meta.glob<string>('./media/puzzle/*.jpeg', { eager: true, import: 'default', query: '?url' }))

function memoriesFromAssets(assets: [string, string][], category: string, title: string): Memory[] {
  return assets.map(([, image], index) => ({
    title: `${title} ${index + 1}`,
    category,
    date: 'A day to remember',
    caption: 'A little moment to keep close.',
    image,
  }))
}

const localMemories = memoriesFromAssets(photoAssets, 'Our Photos', 'Photo')

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', ...init })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Request failed (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function CountdownPage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(Date.now())
  const left = Math.max(0, anniversary.getTime() - now)
  const countdown = [
    ['days', Math.floor(left / 86400000)],
    ['hours', Math.floor((left / 3600000) % 24)],
    ['minutes', Math.floor((left / 60000) % 60)],
    ['seconds', Math.floor((left / 1000) % 60)],
  ] as const

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return <main className="countdown-page">
    <div className="countdown-orb orb-one" /><div className="countdown-orb orb-two" />
    <HeartBubbles />
    <div className="countdown-top"><Link className="brand" to="/"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span><span>made with love, for you</span></Link><div className="countdown-actions"><span className="date-pill"><Sparkles size={14} /> August 13, 2027</span><CountdownMusic /></div></div>
    <div className="countdown-content">
      <motion.div className="hero-heart" animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}><Heart size={75} fill="currentColor" strokeWidth={1.3} /><span className="heart-sparkle">✦</span></motion.div>
      <span className="eyebrow">a little countdown to forever</span>
      <h1>Our First<br /><em>Anniversary</em> <span className="title-heart">♥</span></h1>
      <p className="countdown-subtitle">One love, one journey, and a thousand beautiful memories.</p>
      <div className="countdown-clock" aria-label="Time remaining">
        {countdown.map(([unit, value]) => <div className="time-unit" key={unit}><strong>{String(value).padStart(2, '0')}</strong><span>{unit}</span></div>)}
      </div>
      <p className="countdown-message">Our special day is getting closer, baby.<br className="desktop-break" /> Are you ready for our next beautiful chapter?</p>
      {left > 0
        ? <div className="locked-note"><span className="lock-circle"><LockKeyhole size={17} /></span><span>Our love story continues soon...</span></div>
        : <button className="button primary" onClick={() => navigate('/pin')}>Open your letter <ArrowRight size={17} /></button>}
    </div>
    <div className="countdown-footer"><span>Made by Kean Moscoso</span><span>♡ &nbsp; forever starts here</span></div>
  </main>
}

const heartBubblePositions = [
  { left: '8%', delay: '0s', duration: '11s', size: '30px' },
  { left: '20%', delay: '4s', duration: '13s', size: '23px' },
  { left: '34%', delay: '1.5s', duration: '12s', size: '27px' },
  { left: '49%', delay: '6s', duration: '14s', size: '21px' },
  { left: '63%', delay: '2.5s', duration: '11.5s', size: '29px' },
  { left: '77%', delay: '5s', duration: '13.5s', size: '24px' },
  { left: '91%', delay: '3s', duration: '12.5s', size: '31px' },
]

function HeartBubbles() {
  const [popped, setPopped] = useState<number[]>([])
  const pop = (index: number) => {
    if (popped.includes(index)) return
    setPopped(items => [...items, index])
    window.setTimeout(() => setPopped(items => items.filter(item => item !== index)), 650)
  }

  return <div className="heart-bubbles" aria-label="Floating hearts to pop">
    {heartBubblePositions.map((bubble, index) => <button
      key={index}
      type="button"
      className={`heart-bubble${popped.includes(index) ? ' popped' : ''}`}
      style={{
        left: bubble.left,
        animationDelay: bubble.delay,
        animationDuration: bubble.duration,
        '--bubble-size': bubble.size,
      } as React.CSSProperties}
      aria-label="Pop a floating heart"
      onClick={() => pop(index)}
    ><Heart size={19} fill="currentColor" /></button>)}
  </div>
}

function PinPage({ onUnlock }: { onUnlock: () => void }) {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const enterDigit = (digit: string) => { if (pin.length < 4) { setPin(value => value + digit); setError('') } }
  const unlock = async () => {
    if (pin.length !== 4) { setError('Enter all four little numbers first.'); return }
    setBusy(true)
    try {
      await request('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
      onUnlock()
      navigate('/puzzle')
    } catch (reason) {
      setPin('')
      setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  return <main className="pin-page"><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to countdown</Link><motion.section className="pin-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
    <div className="pin-icon"><span>💌</span></div><span className="eyebrow">just between us</span><h1>A Little Secret<br />for You, Baby</h1><p>Enter our special PIN to unlock our memories.</p>
    <div className="pin-dots" aria-label={`${pin.length} of 4 digits entered`}>{Array.from({ length: 4 }, (_, index) => <span className={pin.length > index ? 'filled' : ''} key={index}>{pin.length > index ? <Heart size={15} fill="currentColor" /> : ''}</span>)}</div>
    <div className="keypad">{['1','2','3','4','5','6','7','8','9','clear','0','delete'].map(key => <button key={key} type="button" className={`key ${key === 'clear' || key === 'delete' ? 'key-utility' : ''}`} aria-label={key === 'delete' ? 'Backspace' : key === 'clear' ? 'Clear PIN' : `Enter ${key}`} onClick={() => key === 'clear' ? (setPin(''), setError('')) : key === 'delete' ? setPin(value => value.slice(0, -1)) : enterDigit(key)}>{key === 'clear' ? 'clear' : key === 'delete' ? <ChevronLeft size={21} /> : key}</button>)}</div>
    {error && <p className="pin-error" role="alert">{error}</p>}
    <button className="button primary unlock-button" type="button" onClick={() => void unlock()} disabled={busy}>{busy ? 'Opening your letter...' : <>Unlock our story <Heart size={16} fill="currentColor" /></>}</button>
    <span className="pin-hint">a little secret, just for us ♡</span>
  </motion.section></main>
}

function ProtectedRoute({ unlocked, contentReady, children }: { unlocked: boolean; contentReady: boolean; children: React.ReactNode }) {
  const location = useLocation()
  if (!unlocked) return <Navigate to="/pin" replace state={{ from: location }} />
  if (!contentReady) return <LoadingScreen />
  return <><SiteHeader /><PageTransition>{children}</PageTransition></>
}

function PuzzlePage({ content }: { content: AnniversaryContent }) {
  const [size, setSize] = useState(4)
  const [pieces, setPieces] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(false)
  const [first, setFirst] = useState<number | null>(null)
  const shuffle = useCallback((difficulty = size) => {
    const result = Array.from({ length: difficulty * difficulty }, (_, index) => index)
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
    if (result.every((piece, i) => piece === i)) [result[0], result[1]] = [result[1], result[0]]
    setSize(difficulty); setPieces(result); setMoves(0); setSeconds(0); setDone(false); setFirst(null)
  }, [size])
  useEffect(() => { shuffle(4) }, [])
  useEffect(() => { if (done || pieces.length === 0) return; const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => window.clearInterval(timer) }, [done, pieces.length])
  const selectPiece = (index: number) => {
    if (done) return
    if (first === null) setFirst(index)
    else if (first === index) setFirst(null)
    else {
      const next = [...pieces]; [next[first], next[index]] = [next[index], next[first]]
      setPieces(next); setMoves(value => value + 1); setFirst(null)
      if (next.every((piece, position) => piece === position)) setDone(true)
    }
  }
  return <PageShell eyebrow="a little piece of us" title="Our Picture Puzzle" subtitle="Put our little pieces of love back together, baby.">
    <div className="puzzle-layout"><section className="puzzle-board-wrap"><div className="puzzle-toolbar"><span><Sparkles size={16} /> piece by piece</span></div>
      <div className={`puzzle-board ${size === 5 ? 'puzzle-hard' : ''}`} style={{ '--grid': size } as React.CSSProperties} aria-label={`${size} by ${size} picture puzzle`}>
        {pieces.map((piece, index) => <button key={index} type="button" onClick={() => selectPiece(index)} aria-label={`Puzzle piece ${piece + 1}`} className={`puzzle-piece${first === index ? ' selected' : ''}`} style={{ backgroundImage: `url("${content.puzzleImage}")`, backgroundSize: `${size * 100}% ${size * 100}%`, backgroundPosition: `${(piece % size) * 100 / (size - 1)}% ${Math.floor(piece / size) * 100 / (size - 1)}%` }} />)}
        {done && <div className="puzzle-complete"><span>🎉💖✨</span><h2>You completed our puzzle!</h2><p>Just like these pieces, we belong together. ❤️</p><Link className="button primary" to="/story">Continue Our Story <ArrowRight size={16} /></Link></div>}
      </div>
      <div className="puzzle-controls"><button className={`button soft${hint ? ' hint-active' : ''}`} onClick={() => setHint(value => !value)}>{hint ? 'Hide hint' : 'Show hint'} <span className="hint-icon">♡</span></button><button className="button soft" onClick={() => shuffle()}><RotateCcw size={15} /> Shuffle again</button></div>
    </section><aside className="puzzle-side"><div className="side-card"><span className="eyebrow">a little challenge</span><h3>Our puzzle</h3><div className="difficulty-options"><button type="button" className="selected" disabled>Medium<span>16 pieces</span></button></div><div className="puzzle-stats"><div><span>moves</span><strong>{moves}</strong></div><div><span>time</span><strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></div></div><p className="handwritten tiny-note">every little piece belongs ♡</p></div></aside></div>
    {hint && <div className="hint-overlay" onClick={() => setHint(false)} role="dialog" aria-label="Puzzle image hint"><button aria-label="Close hint"><X /></button><img src={content.puzzleImage} alt="Original puzzle image" /></div>}
  </PageShell>
}

function StoryPage({ content }: { content: AnniversaryContent }) {
  return <PageShell eyebrow="the best is still ahead" title="Every Love Story Is Beautiful," subtitle="But ours is my favorite.">
    <div className="timeline">{content.story.map((moment, index) => <motion.article key={moment.title} className={`timeline-item${index % 2 ? ' reverse' : ''}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }}>
      <div className="timeline-photo"><img src={moment.image} alt={moment.title} loading="lazy" /><span className="photo-heart"><Heart size={16} fill="currentColor" /></span></div><div className="timeline-copy"><span className="moment-date">{moment.date}</span><h2>{moment.title}</h2><p>{moment.description}</p><span className="tiny-heart">♡ &nbsp; one of my favorite chapters</span></div>
    </motion.article>)}</div>
    <section className="love-note"><div className="note-sparkle">✦</div><span className="eyebrow">a note from my heart</span><h2>To my favorite person</h2><p>{content.letter}</p><span className="signature">all my love, always ♡</span></section>
    <div className="center-next"><Link className="button primary" to="/gallery">Keep wandering <ArrowRight size={16} /></Link></div>
  </PageShell>
}

function GalleryPage({ content }: { content: AnniversaryContent }) {
  const [memories, setMemories] = useState(content.memories)
  const [category, setCategory] = useState('All memories')
  const [selected, setSelected] = useState<Memory | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [slide, setSlide] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const categories = ['All memories', ...new Set(memories.map(item => item.category))]
  const visible = memories.filter(item => category === 'All memories' || item.category === category)
  useEffect(() => {
    if (!slide || visible.length < 1) return
    const timer = window.setInterval(() => setSelected(current => {
      const index = visible.findIndex(item => item.title === current?.title)
      return visible[(index + 1) % visible.length]
    }), 3000)
    return () => window.clearInterval(timer)
  }, [slide, visible])
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadError('')
    const form = new FormData()
    Array.from(files).slice(0, 10).forEach(file => form.append('photos', file))
    try {
      const result = await request<{ files: { name: string; url: string }[] }>('/api/uploads', { method: 'POST', body: form })
      setMemories(old => [...result.files.map(file => ({ title: file.name.replace(/\.[^.]+$/, ''), category: 'Special Days', date: 'A new memory', caption: 'A little moment I want to keep forever.', image: file.url })), ...old])
      setCategory('All memories')
    } catch (reason) { setUploadError(reason instanceof Error ? reason.message : 'Could not upload those photos.') }
  }
  const moveSlide = (direction: number) => { const index = visible.findIndex(item => item.title === selected?.title); setSelected(visible[(index + direction + visible.length) % visible.length]) }
  return <PageShell eyebrow="our favorite little moments" title="A Gallery of Us" subtitle="Every picture holds a little piece of my heart.">
    <div className="gallery-toolbar"><div className="filter-pills">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}</div><div className="gallery-actions"><button className={`button soft slideshow-button${slide ? ' hint-active' : ''}`} onClick={() => { setSlide(value => !value); if (!selected && visible[0]) setSelected(visible[0]) }}>{slide ? 'Pause slideshow' : 'Play slideshow'} <span>{slide ? 'Ⅱ' : '▶'}</span></button><label className="button primary upload-button"><Upload size={16} /> Add photos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={event => void upload(event.target.files)} /></label></div></div>
    {uploadError && <p className="inline-error" role="alert">{uploadError}</p>}
    <div className="memory-grid">{visible.map((memory, index) => <motion.article key={`${memory.title}-${index}`} className={`memory-card memory-${index % 3}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 6) * 0.06 }}><button className="memory-image" onClick={() => setSelected(memory)} aria-label={`Open ${memory.title}`}><img src={memory.image} alt={memory.title} loading="lazy" /><span className="image-open">take a closer look ↗</span></button><button className={`favorite-heart${favorites.includes(memory.title) ? ' liked' : ''}`} aria-label={favorites.includes(memory.title) ? 'Remove favorite' : 'Favorite memory'} onClick={() => setFavorites(items => items.includes(memory.title) ? items.filter(item => item !== memory.title) : [...items, memory.title])}><Heart size={19} fill={favorites.includes(memory.title) ? 'currentColor' : 'none'} /></button><div className="memory-caption"><span>{memory.category} · {memory.date}</span><h3>{memory.title}</h3><p>{memory.caption}</p></div></motion.article>)}</div>
    <div className="center-next"><Link className="button primary" to="/reasons">A few more things I love <ArrowRight size={16} /></Link></div>
    <AnimatePresence>{selected && <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelected(null); setSlide(false) }} role="dialog" aria-label="Memory photo"><button className="lightbox-close" aria-label="Close photo" onClick={() => { setSelected(null); setSlide(false) }}><X /></button><button className="lightbox-arrow left" aria-label="Previous photo" onClick={event => { event.stopPropagation(); moveSlide(-1) }}><ChevronLeft /></button><motion.figure key={selected.image} initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={event => event.stopPropagation()}><img src={selected.image} alt={selected.title} /><figcaption>{selected.title} · {selected.caption}</figcaption></motion.figure><button className="lightbox-arrow right" aria-label="Next photo" onClick={event => { event.stopPropagation(); moveSlide(1) }}><ChevronRight /></button></motion.div>}</AnimatePresence>
  </PageShell>
}

function ReasonsPage({ content }: { content: AnniversaryContent }) {
  const [revealed, setRevealed] = useState<number[]>([])
  const hearts = ['💗', '💖', '💘', '💕', '💝', '❤️', '💓', '💞']
  return <PageShell eyebrow="a little list that could go on forever" title="Reasons Why I Love You, Baby" subtitle="Tap a heart. I promise there are a million more.">
    <div className="reasons-grid">{content.reasons.map((reason, index) => <motion.button key={`${reason}-${index}`} className={`reason-card${revealed.includes(index) ? ' revealed' : ''}`} onClick={() => setRevealed(items => items.includes(index) ? items : [...items, index])} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} aria-label={revealed.includes(index) ? reason : `Reveal reason ${index + 1}`}><span className="reason-number">0{index + 1}</span><span className="reason-heart">{revealed.includes(index) ? hearts[index % hearts.length] : '♡'}</span>{revealed.includes(index) ? <motion.span className="reason-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{reason}</motion.span> : <span className="reason-prompt">tap to reveal</span>}<span className="reason-bottom">a little thing i adore</span></motion.button>)}</div>
    <section className="reasons-footnote"><span>♡</span><p>{revealed.length === content.reasons.length ? 'And a million more reasons, every day.' : `${content.reasons.length - revealed.length} more little reasons are waiting for you.`}</p></section>
    <div className="center-next"><Link className="button primary" to="/surprise">One last little surprise <ArrowRight size={16} /></Link></div>
  </PageShell>
}

function SurprisePage({ content }: { content: AnniversaryContent }) {
  const [open, setOpen] = useState(false)
  const [forever, setForever] = useState(false)

  return <PageShell eyebrow="and now, the part i saved just for you" title="Happy 1st Anniversary, Baby! ❤️" subtitle="One year down, a forever to go.">
    <div className="surprise-layout"><div className="surprise-photo"><img src={content.surpriseImage} alt="A photo for our anniversary" /><span>my favorite view ♡</span><span className="photo-doodle">♥</span></div>
      <div className={`envelope${open ? ' opened' : ''}`}><div className="envelope-back" /><div className="letter-paper"><div className="letter-stamp">♡</div><span className="eyebrow">to my forever favorite</span><h2>My dearest love,</h2><p>{content.surpriseLetter}</p><span className="signature">yours, always ♡</span></div><button className="envelope-front" onClick={() => setOpen(true)} aria-label={open ? 'Love letter opened' : 'Open your anniversary letter'}><span className="envelope-flap" /><span className="wax-seal">♥</span>{!open && <span className="envelope-prompt">tap to open your letter</span>}</button></div></div>
    {open && <motion.div className="forever-section" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}><p>And this, my love, is only the beginning.</p>{!forever ? <button className="button primary forever-button" onClick={() => setForever(true)}>Forever and Always <Heart size={17} fill="currentColor" /></button> : <motion.div className="forever-message" initial={{ scale: 0.9 }} animate={{ scale: 1 }}><span>💋</span><p>This is only the beginning of our forever.<br />I love you, baby. Mwah mwah! 💋❤️</p><div className="floating-hearts">♥　♡　♥　♡　♥</div></motion.div>}</motion.div>}
    <div className="journey-footer"><Heart size={14} fill="currentColor" /> our story, always unfolding <Heart size={14} fill="currentColor" /></div>
  </PageShell>
}

export default function App() {
  const location = useLocation()
  const [unlocked, setUnlocked] = useState(false)
  const [checked, setChecked] = useState(false)
  const [content, setContent] = useState<AnniversaryContent | null>(null)
  const [loadError, setLoadError] = useState('')
  const [puzzleImage, setPuzzleImage] = useState('')

  const refresh = useCallback(async () => {
    try {
      const session = await request<{ unlocked: boolean }>('/api/session')
      setUnlocked(session.unlocked)
      if (session.unlocked) {
        const privateContent = await request<AnniversaryContent>('/api/content')
        const personalizedContent = {
          ...privateContent,
          story: privateContent.story.map((moment, index) => ({
            ...moment,
            image: photoAssets[index]?.[1] ?? moment.image,
          })),
          memories: localMemories.length > 0 ? localMemories : privateContent.memories,
          puzzleImage: puzzleAssets[0] ?? privateContent.puzzleImage,
          surpriseImage: photoAssets[1]?.[1] ?? photoAssets[0]?.[1] ?? privateContent.surpriseImage,
        }
        setContent(personalizedContent)
        setPuzzleImage(personalizedContent.puzzleImage)
      }
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Could not load your memories.')
    } finally { setChecked(true) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const beforeDate = Date.now() < anniversary.getTime()
  const countdownLocked = beforeDate
  const data = useMemo(() => content && puzzleImage ? { ...content, puzzleImage } : content, [content, puzzleImage])

  if (!checked) return <LoadingScreen />
  if (countdownLocked) return <CountdownPage />
  if (location.pathname === '/' && !countdownLocked) return <Navigate to={unlocked ? '/puzzle' : '/pin'} replace />
  if (loadError && unlocked && !content) return <main className="error-screen"><p role="alert">{loadError}</p><button className="button soft" onClick={() => { setChecked(false); setLoadError(''); void refresh() }}>Try again</button></main>
  if (!unlocked && location.pathname !== '/pin' && location.pathname !== '/') return <Navigate to="/pin" replace />
  const protectedPage = (element: React.ReactNode) => <ProtectedRoute unlocked={unlocked} contentReady={data !== null}>{element}</ProtectedRoute>
  return <Routes>
    <Route path="/" element={<CountdownPage />} />
    <Route path="/pin" element={unlocked ? <Navigate to="/puzzle" replace /> : <PinPage onUnlock={() => { setChecked(false); void refresh() }} />} />
    <Route path="/puzzle" element={data ? protectedPage(<PuzzlePage content={data} />) : <LoadingScreen />} />
    <Route path="/story" element={data ? protectedPage(<StoryPage content={data} />) : <LoadingScreen />} />
    <Route path="/gallery" element={data ? protectedPage(<GalleryPage content={data} />) : <LoadingScreen />} />
    <Route path="/reasons" element={data ? protectedPage(<ReasonsPage content={data} />) : <LoadingScreen />} />
    <Route path="/surprise" element={data ? protectedPage(<SurprisePage content={data} />) : <LoadingScreen />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

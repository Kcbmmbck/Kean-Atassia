import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Heart, Music2, Pause, Play } from 'lucide-react'

const anniversarySong = new URL('./media/music/Justin Bieber - Baby ft. Ludacris.mp3', import.meta.url).href
const countdownSong = new URL('./media/countdown music/LOVE COUNTDOWN (Feat. Wonstein).mp3', import.meta.url).href

const links = [
  ['Puzzle', '/puzzle'],
  ['Our story', '/story'],
  ['Memories', '/gallery'],
  ['Reasons', '/reasons'],
  ['Surprise', '/surprise'],
]

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" to="/puzzle" aria-label="Our love story home"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span><span>our little story</span></Link>
      <nav aria-label="Main navigation">
        {links.map(([label, href]) => <NavLink key={href} to={href} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{label}</NavLink>)}
      </nav>
      <MusicPlayer source={anniversarySong} label="Our song" />
    </header>
  )
}

function MusicPlayer({ source, label }: { source: string; label: string }) {
  const [playing, setPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let disposed = false
    const play = (automatic: boolean) => {
      void audio.play().catch(reason => {
        if (disposed || (automatic && reason instanceof DOMException && reason.name === 'NotAllowedError')) return
        setPlaybackError(reason instanceof Error ? `Could not play the song: ${reason.message}` : 'Could not play the song.')
      })
    }
    const resumeAfterInteraction = () => {
      window.removeEventListener('pointerdown', resumeAfterInteraction)
      window.removeEventListener('keydown', resumeAfterInteraction)
      play(false)
    }
    play(true)
    window.addEventListener('pointerdown', resumeAfterInteraction, { once: true })
    window.addEventListener('keydown', resumeAfterInteraction, { once: true })
    return () => {
      disposed = true
      window.removeEventListener('pointerdown', resumeAfterInteraction)
      window.removeEventListener('keydown', resumeAfterInteraction)
    }
  }, [source])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    setPlaybackError('')
    try {
      await audio.play()
    } catch (reason) {
      setPlaybackError(reason instanceof Error ? `Could not play the song: ${reason.message}` : 'Could not play the song.')
    }
  }

  return <><button className="music-button" type="button" onClick={() => void toggle()} aria-label={playbackError || (playing ? `Pause ${label}` : `Play ${label}`)} title={playbackError || (playing ? `Pause ${label}` : `Play ${label}`)}>{playing ? <Pause size={16} /> : <Play size={16} />}<Music2 size={15} /><span className="music-label">{playing ? 'Playing' : label}</span></button><audio ref={audioRef} src={source} preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setPlaybackError('The song file could not be loaded.')} />{playbackError && <span className="music-error" role="alert">{playbackError}</span>}</>
}

export function CountdownMusic() {
  return <MusicPlayer source={countdownSong} label="Countdown song" />
}

export function LoadingScreen() {
  return <div className="loading-screen" role="status"><span className="loading-heart"><Heart size={36} fill="currentColor" /></span><span>gathering our little memories...</span></div>
}

export function PageShell({ children, eyebrow, title, subtitle }: { children: React.ReactNode; eyebrow?: string; title?: string; subtitle?: string }) {
  return <main className="page-shell"><div className="page-heading">{eyebrow && <span className="eyebrow">{eyebrow}</span>}{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div>{children}</main>
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>
}

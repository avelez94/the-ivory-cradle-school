'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  enrollmentId: string | null // null in staff preview: nothing is saved
  cycleId: string
  required: boolean
  watchedSeconds: number
  lastPosition: number
  durationSeconds: number
  videoUrl: string
  captionsUrl: string | null
  title: string
}

const BEAT_MS = 5000

function showCaptions(video: HTMLVideoElement | null, on: boolean) {
  const track = video?.textTracks?.[0]
  if (track) track.mode = on ? 'showing' : 'hidden'
}

function clock(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function LessonPlayer(props: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [required, setRequired] = useState(props.required)
  const [frontier, setFrontier] = useState(props.watchedSeconds) // furthest point allowed to seek to
  const frontierRef = useRef(props.watchedSeconds)
  const lastTimeRef = useRef(0)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(props.durationSeconds)
  const [playing, setPlaying] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState<'idle' | 'saved' | 'offline'>('idle')
  const requiredRef = useRef(props.required)
  const completedRef = useRef(!props.required)

  const bumpFrontier = (t: number) => {
    if (t > frontierRef.current) {
      frontierRef.current = t
      setFrontier(t)
    }
  }

  const beat = useCallback(
    async (position: number, opts: { final?: boolean; keepalive?: boolean } = {}) => {
      if (!props.enrollmentId || completedRef.current) return null
      try {
        const res = await fetch(`/api/learn/${props.enrollmentId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycleId: props.cycleId, position }),
          keepalive: opts.keepalive,
          credentials: 'same-origin',
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        setSaving('saved')
        // The server's verified point is the source of truth for how far ahead seeking may go.
        if (data.watchedSeconds > frontierRef.current) bumpFrontier(data.watchedSeconds)
        if (data.viewingComplete && !completedRef.current) {
          completedRef.current = true
          requiredRef.current = false
          setRequired(false)
          setMessage('Lesson complete. The quiz is unlocked.')
          router.refresh()
        }
        return data
      } catch {
        setSaving('offline')
        return null
      }
    },
    [props.enrollmentId, props.cycleId, router],
  )

  // Resume at the furthest verified point (or last position once viewing is complete).
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const start = () => {
      const target = props.required ? Math.min(props.watchedSeconds, (v.duration || props.durationSeconds) - 0.5) : Math.min(props.lastPosition, (v.duration || props.durationSeconds) - 0.5)
      if (target > 1) v.currentTime = Math.max(0, target)
      lastTimeRef.current = v.currentTime
      if (v.duration && Number.isFinite(v.duration)) setDuration(v.duration)
    }
    if (v.readyState >= 1) start()
    else v.addEventListener('loadedmetadata', start, { once: true })
  }, [props.required, props.watchedSeconds, props.lastPosition, props.durationSeconds])

  // Report progress every few seconds while playing.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const v = videoRef.current
      if (v && !v.paused) beat(v.currentTime)
    }, BEAT_MS)
    return () => window.clearInterval(id)
  }, [playing, beat])

  useEffect(() => {
    const onHide = () => {
      const v = videoRef.current
      if (document.visibilityState === 'hidden' && v) beat(v.currentTime, { keepalive: true })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [beat])

  useEffect(() => {
    showCaptions(videoRef.current, captions)
  }, [captions])

  const onTimeUpdate = () => {
    const v = videoRef.current!
    const t = v.currentTime
    const last = lastTimeRef.current
    // Advance the local frontier only through continuous playback from at or before it.
    if (!v.seeking && !v.paused && t > last && t - last < 1.5 && last <= frontierRef.current + 0.6) bumpFrontier(t)
    lastTimeRef.current = t
    setTime(t)
  }

  const onSeeking = () => {
    const v = videoRef.current!
    if (requiredRef.current && v.currentTime > frontierRef.current + 0.5) {
      v.currentTime = frontierRef.current
      setMessage('You can replay anything you have watched. The rest of the lesson unlocks as you watch.')
    }
    lastTimeRef.current = v.currentTime
  }

  const onRateChange = () => {
    const v = videoRef.current!
    if (requiredRef.current && v.playbackRate !== 1) {
      v.playbackRate = 1
      setMessage('The lesson plays at normal speed until you finish watching it once.')
    }
    setRate(v.playbackRate)
  }

  const onEnded = async () => {
    setPlaying(false)
    const v = videoRef.current!
    for (let i = 0; i < 8 && !completedRef.current; i++) {
      const data = await beat(v.duration || duration, { final: true })
      if (completedRef.current) break
      if (data && data.remainingSeconds > 5) {
        setMessage(`The quiz unlocks after the full lesson. ${clock(data.remainingSeconds)} of required viewing remains.`)
        break
      }
      await new Promise((r) => setTimeout(r, 3200))
    }
  }

  const toggle = () => {
    const v = videoRef.current!
    if (v.paused) {
      v.play().catch(() => setMessage('Press play to start the lesson.'))
    } else v.pause()
  }

  const seekTo = (t: number) => {
    const v = videoRef.current!
    const max = requiredRef.current ? frontierRef.current : v.duration || duration
    if (requiredRef.current && t > frontierRef.current + 0.5) {
      setMessage('You can replay anything you have watched. The rest of the lesson unlocks as you watch.')
    }
    v.currentTime = Math.max(0, Math.min(t, max))
    lastTimeRef.current = v.currentTime
    setTime(v.currentTime)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const v = videoRef.current
    if (!v || (e.target as HTMLElement).tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === ' ' || k === 'k') {
      if ((e.target as HTMLElement).tagName === 'BUTTON' && k === ' ') return
      e.preventDefault()
      toggle()
    } else if (k === 'arrowleft' || k === 'j') {
      e.preventDefault()
      seekTo(v.currentTime - 10)
    } else if (k === 'arrowright' || k === 'l') {
      e.preventDefault()
      seekTo(v.currentTime + 10)
    } else if (k === 'c') setCaptions((c) => !c)
    else if (k === 'm') {
      v.muted = !v.muted
      setMuted(v.muted)
    }
  }

  const fullscreen = () => {
    const el = shellRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else if (el.requestFullscreen) el.requestFullscreen()
    else (videoRef.current as unknown as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen?.()
  }

  const pct = (x: number) => `${Math.min(100, (x / (duration || 1)) * 100)}%`
  const remaining = Math.max(0, duration - frontier)

  return (
    <div className="player" ref={shellRef} onKeyDown={onKey} role="region" aria-label={`Lesson video: ${props.title}`}>
      <video
        ref={videoRef}
        src={props.videoUrl}
        preload="metadata"
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate noremoteplayback"
        onClick={toggle}
        onPlay={() => {
          setPlaying(true)
          setMessage('')
          beat(videoRef.current!.currentTime)
        }}
        onPause={() => {
          setPlaying(false)
          const v = videoRef.current!
          if (!v.ended) beat(v.currentTime)
        }}
        onTimeUpdate={onTimeUpdate}
        onSeeking={onSeeking}
        onRateChange={onRateChange}
        onEnded={onEnded}
        onDurationChange={() => {
          const d = videoRef.current!.duration
          if (Number.isFinite(d)) setDuration(d)
        }}
      >
        {props.captionsUrl && <track kind="captions" src={props.captionsUrl} srcLang="en" label="English" default />}
      </video>
      <div className="player-bar">
        <div className="scrub">
          <div className="track" />
          <div className="watched" style={{ width: required ? pct(frontier) : '100%' }} />
          <div className="played" style={{ width: pct(time) }} />
          <div className="thumb" style={{ left: pct(time) }} />
          <input
            type="range"
            min={0}
            max={Math.floor(duration)}
            step={1}
            value={Math.floor(time)}
            onChange={(e) => seekTo(Number(e.target.value))}
            aria-label="Lesson position"
            aria-valuetext={`${clock(time)} of ${clock(duration)}${required ? `, watched up to ${clock(frontier)}` : ''}`}
          />
        </div>
        <div className="controls">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => seekTo(time - 10)} aria-label="Rewind 10 seconds">
            Back 10s
          </button>
          <button type="button" onClick={() => seekTo(time + 10)} aria-label="Forward 10 seconds within what you have watched" disabled={required && time >= frontier - 0.5}>
            Ahead 10s
          </button>
          <button type="button" onClick={() => seekTo(0)}>
            From start
          </button>
          {props.captionsUrl && (
            <button type="button" aria-pressed={captions} onClick={() => setCaptions((c) => !c)}>
              Captions
            </button>
          )}
          <button
            type="button"
            aria-pressed={muted}
            onClick={() => {
              const v = videoRef.current!
              v.muted = !v.muted
              setMuted(v.muted)
            }}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          {!required && (
            <label className="sr-only" htmlFor="speed">
              Playback speed
            </label>
          )}
          {!required && (
            <select
              id="speed"
              value={rate}
              onChange={(e) => {
                videoRef.current!.playbackRate = Number(e.target.value)
              }}
              style={{ width: 'auto', minHeight: 40, padding: '6px 10px', background: 'transparent', color: 'var(--ivory)', borderColor: '#6d5a50' }}
            >
              {[1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r} style={{ color: 'var(--espresso)' }}>
                  {r}x
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={fullscreen}>
            Full screen
          </button>
          <span className="time" aria-hidden="true">
            {clock(time)} / {clock(duration)}
          </span>
        </div>
        <p className="player-msg" aria-live="polite">
          {message ||
            (required
              ? `Required viewing: ${clock(remaining)} left. You can pause, rewind, and replay anytime.${props.enrollmentId && saving === 'saved' ? ' Progress saved.' : ''}${saving === 'offline' ? ' Progress could not be saved. Check your connection.' : ''}`
              : props.enrollmentId
                ? 'Lesson complete. Watch again anytime at any speed.'
                : 'Staff preview. Progress is not saved.')}
        </p>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { makeNoise, loadPopSamples, playSample, playPop } from './popSound.js'
import k1 from './assets/kernels/k1.webp'
import k2 from './assets/kernels/k2.webp'
import k3 from './assets/kernels/k3.webp'
import k4 from './assets/kernels/k4.webp'
import k5 from './assets/kernels/k5.webp'
import p7 from './assets/popcorn/p7.webp'
import p8 from './assets/popcorn/p8.webp'
import p9 from './assets/popcorn/p9.webp'

// The 404 page's background: kernels drift down the screen and pop when the pointer lingers
// near them. Until the visitor starts the game it is just a quiet hint; in play, kernels fall
// faster, popping scores, and kernels that reach the floor unpopped cost a life.

const LIVES = 3
const GOLD_EVERY = 25 // pops between golden kernels
const COMBO_WINDOW = 1.6 // seconds between pops that keep a combo alive
const BEST_KEY = 'popcorn-404-best'
const BURST = 0.09
const PACE_MAX = 1.3
// the opening: fast enough to be exciting, then a slightly gentler stretch to settle in, then normal
const FAST_POPS = 8
const SETTLE_POPS = 10
const START_EASE = 0.92
const SETTLE_EASE = 0.86

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutBack = (t) => {
  const c1 = 2.2
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

let KERNEL_IMGS = []
let POP_IMGS = []
function loadImages() {
  if (KERNEL_IMGS.length) return
  const make = (url) => {
    const img = new Image()
    img.src = url
    return img
  }
  KERNEL_IMGS = [k1, k2, k3, k4, k5].map(make)
  POP_IMGS = [p7, p8, p9].map(make)
}
const ready = (img) => img && img.complete && img.naturalWidth

function fit(img, long) {
  const ratio = img.naturalWidth / img.naturalHeight
  return ratio >= 1 ? [long, long / ratio] : [long * ratio, long]
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

export default function PopGame({ mode, onStart, onOver, onFirstPop }) {
  const canvasRef = useRef(null)
  const modeRef = useRef(mode)
  const gameRef = useRef(null)
  const overRef = useRef(onOver)
  const mutedRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const [hud, setHud] = useState({ score: 0, lives: LIVES, combo: 0, mult: 1, level: 1 })
  const [best, setBest] = useState(readBest)

  useEffect(() => {
    overRef.current = onOver
  }, [onOver])

  useEffect(() => {
    if (hud.score > 0) onFirstPop?.()
  }, [hud.score, onFirstPop])

  useEffect(() => {
    modeRef.current = mode
    if (mode === 'playing') gameRef.current?.start()
  }, [mode])

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    loadImages()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let vw = 0
    let vh = 0
    let dpr = 1
    let S = 1 // size scale: kernels are a bit bigger on phones
    let raf = 0
    let last = performance.now()
    let audio = null

    const m = { x: -1e4, y: -1e4, active: false }
    const g = {
      kernels: [],
      floaters: [],
      time: 0,
      playTime: 0,
      lastBx: 0,
      pace: 0, // how hard the game is right now: 0 gentle .. 1 fast .. 1.3 frantic
      lastPopAt: 0,
      pops: 0, // kernels popped this game (not counting a golden kernel's chain)
      ease: START_EASE, // < 1 = gentler than the normal pace; used to shape the opening
      spawnT: 0.6,
      score: 0,
      lives: LIVES,
      combo: 0,
      lastPop: -99,
      sinceGold: 0,
      goldDue: false,
      burnFlash: 0,
      goldFlash: 0,
    }

    const playing = () => modeRef.current === 'playing'
    const heatR = () => 120 * S

    function ensureAudio() {
      if (audio) return audio
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      audio = { ac, noise: makeNoise(ac), buf: null, last: 0 }
      loadPopSamples(audio)
      return audio
    }

    function sound(k) {
      if (!audio || mutedRef.current || !playing()) return
      const now = performance.now()
      if (now - audio.last < 45) return
      audio.last = now
      audio.ac.resume()
      const vol = k.gold ? 1 : 0.7
      if (audio.buf) playSample(audio.ac, audio.buf, vol, clamp((k.x / vw) * 2 - 1, -1, 1) * 0.7)
      else playPop(audio.ac, audio.noise, vol)
    }

    function publish() {
      setHud({ score: g.score, lives: g.lives, combo: g.combo, mult: multiplier(), level: 1 + Math.floor((g.pace / PACE_MAX) * 9) })
    }
    const multiplier = () => Math.min(1 + Math.floor(Math.max(0, g.combo - 1) / 4), 5)

    function spawn(gold = false) {
      const r = (gold ? 62 : 24 + Math.random() * 10) * S
      // harder = kernels land further apart, so you have to travel more between them
      const minGap = vw * lerp(0.06, 0.4, clamp(g.pace / PACE_MAX))
      let bx = r
      for (let i = 0; i < 8; i++) {
        bx = r + Math.random() * Math.max(1, vw - 2 * r)
        if (!playing() || Math.abs(bx - g.lastBx) >= minGap) break
      }
      g.lastBx = bx
      g.kernels.push({
        x: bx,
        bx,
        y: -r,
        r,
        vx: 0,
        vy: 0,
        sway: (14 + Math.random() * 14) * S,
        ph: Math.random() * 6.28,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.9,
        heat: 0,
        born: g.time,
        state: 0,
        t: 0,
        ki: (Math.random() * KERNEL_IMGS.length) | 0,
        gold,
        sprite: null,
        flip: Math.random() < 0.5 ? -1 : 1,
        tilt: (Math.random() - 0.5) * 1.2,
      })
    }

    function floater(x, y, text, color) {
      g.floaters.push({ x, y, text, color, t: 0 })
    }

    function pop(k) {
      k.state = 1
      k.t = 0
      k.heat = 1
      const sprites = POP_IMGS.filter(ready)
      k.sprite = sprites.length ? sprites[(Math.random() * sprites.length) | 0] : null
      k.vx = (Math.random() - 0.5) * 220
      k.vy = -(160 + Math.random() * 140)
      k.vr = (Math.random() - 0.5) * 3
      sound(k)
      if (!playing()) return

      // performance drives the pace: popping kernels soon after they appear speeds the game up
      // fast, slower pops speed it up gently (not at all for the golden kernel's chain pops)
      if (!k.chain && !k.gold) {
        const quick = clamp(1 - (g.time - k.born) / 5)
        g.pace = Math.min(PACE_MAX, g.pace + 0.008 + 0.024 * quick + (g.combo >= 8 ? 0.01 : 0))
        g.lastPopAt = g.time
        g.pops += 1
      }
      g.combo = g.time - g.lastPop < COMBO_WINDOW ? g.combo + 1 : 1
      g.lastPop = g.time
      const mult = multiplier()
      const pts = (k.gold ? 100 : 10) * mult
      g.score += pts
      floater(k.x, k.y - k.r, `+${pts}`, k.gold ? '#fff2b0' : mult > 1 ? '#ffb347' : '#f7e8c4')

      if (k.gold) {
        g.goldFlash = 1
        for (const o of g.kernels) {
          if (o.state === 0 && o !== k) {
            o.chain = true
            pop(o)
            g.score += 10
          }
        }
      } else if (++g.sinceGold >= GOLD_EVERY) {
        g.sinceGold = 0
        g.goldDue = true
      }
      publish()
    }

    function burn(k) {
      if (k.gold) return // a missed golden kernel costs nothing
      g.burnFlash = 1
      g.combo = 0
      g.pace = Math.max(0, g.pace - 0.14) // a miss: back off
      g.lives -= 1
      floater(clamp(k.x, 40, vw - 40), vh - 60, 'burnt!', '#e24b4a')
      publish()
      if (g.lives <= 0) {
        const best = Math.max(readBest(), g.score)
        try {
          localStorage.setItem(BEST_KEY, String(best))
        } catch {
          /* private mode: the score just isn't remembered */
        }
        setBest(best)
        modeRef.current = 'over'
        overRef.current(g.score)
      }
    }

    function update(dt) {
      g.time += dt
      const live = playing()
      if (live) g.playTime += dt
      if (live) {
        // nobody popping for a few seconds means they are struggling (or away): ease off
        if (g.time - g.lastPopAt > 4) g.pace = Math.max(0, g.pace - 0.03 * dt)
        // everyone creeps up a little with time, so nobody can stall the game forever
        g.pace = Math.max(g.pace, clamp(g.playTime / 240) * 0.35)
      }
      const pace = g.pace
      const easeTo = g.pops < FAST_POPS ? START_EASE : g.pops < FAST_POPS + SETTLE_POPS ? SETTLE_EASE : 1
      // dropping into the gentler stretch is quick; coming back out to normal is gradual
      g.ease += (easeTo - g.ease) * Math.min(1, dt * (easeTo > g.ease ? 0.5 : 3))

      g.spawnT -= dt
      if (g.spawnT <= 0) {
        if (live) {
          if (g.goldDue) {
            g.goldDue = false
            spawn(true)
          } else {
            // only so many kernels at once, so a fast player gets a tighter rhythm, not a wall of them
            const onScreen = g.kernels.filter((o) => o.state === 0).length
            if (onScreen < Math.round(lerp(6, 8, clamp(pace / PACE_MAX)))) spawn()
          }
          g.spawnT = (Math.max(0.42, lerp(0.6, 0.5, pace)) / g.ease) * (0.8 + Math.random() * 0.4)
        } else {
          if (!reduceMotion && modeRef.current !== 'idle' && g.kernels.length < 9) spawn()
          g.spawnT = 1.5 + Math.random()
        }
      }

      const fall = live ? lerp(155, 205, pace) * g.ease * S : 60 * S
      const R = heatR()
      for (const k of g.kernels) {
        k.rot += k.vr * dt
        if (k.state === 0) {
          k.y += fall * (k.gold ? 0.55 : 1) * dt
          k.x = k.bx + Math.sin(g.time * 0.9 + k.ph) * k.sway
          let hf = 0
          if (m.active) hf = clamp(1 - Math.hypot(k.x - m.x, k.y - m.y) / R)
          k.near = hf
          if (hf > 0) k.heat += (k.gold ? 0.9 : 1.9) * Math.pow(hf, 0.7) * dt
          else k.heat = Math.max(0, k.heat - 0.5 * dt)
          if (k.heat >= 1) pop(k)
          else if (k.y > vh + k.r) {
            k.state = 2
            if (live) burn(k)
          }
        } else {
          k.t += dt
          k.vy += 520 * dt
          k.vx *= Math.exp(-1.2 * dt)
          k.x += k.vx * dt
          k.y += k.vy * dt
        }
      }
      g.kernels = g.kernels.filter((k) => k.state === 0 || (k.state === 1 && k.t < 1.7 && k.y < vh + 200))

      for (const f of g.floaters) f.t += dt
      g.floaters = g.floaters.filter((f) => f.t < 0.9)
      g.burnFlash = Math.max(0, g.burnFlash - dt * 2.2)
      g.goldFlash = Math.max(0, g.goldFlash - dt * 1.8)
    }

    function drawKernel(k) {
      const img = KERNEL_IMGS[k.ki]
      if (!ready(img)) return
      const [w, h] = fit(img, k.r * 1.6)
      const shake = k.heat * 2
      ctx.save()
      ctx.translate(k.x + Math.sin(g.time * 70 + k.ph) * shake, k.y + Math.cos(g.time * 63 + k.ph) * shake)
      ctx.rotate(k.rot)
      if (k.gold) {
        // a golden kernel: same photo, tinted, with a halo
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, k.r * 1.7)
        halo.addColorStop(0, 'rgba(255,214,90,0.55)')
        halo.addColorStop(1, 'rgba(255,214,90,0)')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(0, 0, k.r * 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
      // glows as the pointer gets close (this is the hint that it can be popped)
      const glow = Math.max(k.heat, (k.near || 0) * 0.6)
      if (glow > 0.05) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = glow * 0.4
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, k.r * (1 + glow * 1.6))
        gr.addColorStop(0, 'rgba(255,130,40,1)')
        gr.addColorStop(1, 'rgba(255,130,40,0)')
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(0, 0, k.r * (1 + glow * 1.6), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = playing() ? 1 : 0.8
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
      if (k.gold) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.7
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
      } else if (glow > 0.05) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = glow * 0.45
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
      }
      ctx.restore()
    }

    function drawPopped(k) {
      ctx.save()
      ctx.translate(k.x, k.y)
      ctx.rotate(k.rot)
      ctx.globalAlpha = clamp((1.7 - k.t) / 0.6)
      const bt = k.t - BURST
      if (bt < 0) {
        const img = KERNEL_IMGS[k.ki]
        if (ready(img)) {
          const u = k.t / BURST
          const [w, h] = fit(img, k.r * 1.6)
          ctx.scale(1 + 0.25 * u, 1 - 0.3 * u)
          ctx.drawImage(img, -w / 2, -h / 2, w, h)
        }
      } else {
        if (ready(k.sprite)) {
          const [w, h] = fit(k.sprite, k.r * 1.6 * 2.2)
          const e = easeOutBack(clamp(bt / 0.45))
          const sc = lerp(0.18, 1, e)
          ctx.rotate(k.tilt * (1 - e))
          ctx.scale(k.flip * sc, sc)
          ctx.drawImage(k.sprite, -w / 2, -h / 2, w, h)
        }
      }
      ctx.restore()
      const f = clamp(bt / 0.25)
      if (bt > 0 && f < 1) {
        ctx.save()
        ctx.translate(k.x, k.y)
        ctx.globalCompositeOperation = 'lighter'
        const R = k.r * 3
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
        gr.addColorStop(0, `rgba(255,240,200,${0.8 * (1 - f) * (1 - f)})`)
        gr.addColorStop(1, 'rgba(255,240,200,0)')
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(0, 0, R, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)

      // warm pool of light under the pointer
      if (m.active) {
        const R = heatR()
        const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, R)
        gr.addColorStop(0, 'rgba(255,120,30,0.14)')
        gr.addColorStop(1, 'rgba(255,120,30,0)')
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(m.x, m.y, R, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const k of g.kernels) {
        if (k.state === 0) drawKernel(k)
        else drawPopped(k)
      }

      if (g.burnFlash > 0) {
        const gr = ctx.createLinearGradient(0, vh, 0, vh - 140)
        gr.addColorStop(0, `rgba(226,75,74,${0.55 * g.burnFlash})`)
        gr.addColorStop(1, 'rgba(226,75,74,0)')
        ctx.fillStyle = gr
        ctx.fillRect(0, vh - 140, vw, 140)
      }
      if (g.goldFlash > 0) {
        ctx.fillStyle = `rgba(255,236,170,${0.35 * g.goldFlash})`
        ctx.fillRect(0, 0, vw, vh)
      }

      ctx.textAlign = 'center'
      ctx.font = `600 ${Math.round(22 * S)}px Figtree, sans-serif`
      for (const f of g.floaters) {
        ctx.globalAlpha = clamp(1 - f.t / 0.9)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y - f.t * 50)
      }
      ctx.globalAlpha = 1
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      vw = document.documentElement.clientWidth
      vh = window.innerHeight
      S = vw < 640 ? 1.3 : 1
      canvas.width = vw * dpr
      canvas.height = vh * dpr
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
    }

    function frame(now) {
      let remaining = Math.min(0.1, (now - last) / 1000)
      last = now
      while (remaining > 1e-4) {
        const dt = Math.min(remaining, 1 / 60)
        remaining -= dt
        update(dt)
      }
      draw()
      raf = requestAnimationFrame(frame)
    }

    function onMove(e) {
      m.x = e.clientX
      m.y = e.clientY
      if (e.pointerType !== 'touch' || e.buttons) m.active = true
    }
    function onDown(e) {
      onMove(e)
      m.active = true
      ensureAudio().ac.resume() // browsers only allow sound after a click, so the audio starts here
      // a tap near a kernel (generous reach, kernels are small) pops it; the golden one needs a few
      for (const k of g.kernels) {
        if (k.state === 0 && Math.hypot(k.x - m.x, k.y - m.y) < Math.max(k.r * 2.6, 64 * S)) k.heat += k.gold ? 0.35 : 1
      }
    }
    function onUp(e) {
      if (e.pointerType === 'touch') m.active = false
    }
    function onLeave() {
      m.active = false
    }

    g.start = () => {
      g.kernels = []
      g.floaters = []
      g.playTime = 0
      g.pace = 0
      g.pops = 0
      g.ease = START_EASE
      g.lastPopAt = g.time
      g.spawnT = 0.25
      g.score = 0
      g.lives = LIVES
      g.combo = 0
      g.lastPop = -99
      g.sinceGold = 0
      g.goldDue = false
      g.burnFlash = 0
      g.goldFlash = 0
      publish()
    }
    gameRef.current = g

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('blur', onLeave)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      audio?.ac.close()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="popgame-canvas" aria-hidden="true" />

      {mode === 'playing' && (
        <div className="popgame-hud">
          <div className="hud-block">
            <span className="hud-label">score</span>
            <span className="hud-score">{hud.score}</span>
          </div>
          <div className="hud-block">
            <span className="hud-label">level</span>
            <span className="hud-value">{hud.level}</span>
          </div>
          <div className="hud-block hud-lives" role="img" aria-label={`${hud.lives} lives left`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <img key={i} src={k1} alt="" data-lost={i >= hud.lives} />
            ))}
          </div>
          <div className="hud-block hud-best">
            <span className="hud-label">best</span>
            <span className="hud-value">{Math.max(best, hud.score)}</span>
          </div>
        </div>
      )}

      {mode !== 'idle' && (
        <button
          type="button"
          className="sound-toggle popgame-mute"
          aria-pressed={!muted}
          aria-label={muted ? 'Unmute pop sounds' : 'Mute pop sounds'}
          onClick={() => setMuted((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            {muted ? <path d="M22 9l-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
          </svg>
        </button>
      )}

      {mode === 'over' && (
        <div className="popgame-over" role="dialog" aria-label="Game over">
          <h2>kernels burnt!</h2>
          <p className="over-score">{hud.score}</p>
          <p className="over-best">{hud.score >= best && hud.score > 0 ? 'new best!' : `best ${best}`}</p>
          <div className="notfound-actions">
            <button type="button" className="notfound-btn notfound-btn-primary" onClick={onStart} autoFocus>
              Play again
            </button>
            <Link to="/" className="notfound-btn notfound-btn-ghost">
              Go to home page
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

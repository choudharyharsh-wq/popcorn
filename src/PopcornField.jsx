import { useEffect, useRef, useState } from 'react'

const REPEL_R = 120
const HEAT_R = 150
const GLOW_R = 230
const BURST_DELAY = 0.09

const KERNEL_DARK = [62, 40, 22]
const KERNEL_HI = [112, 76, 40]
const KERNEL_HOT = [232, 137, 43]
const CREAM = [247, 232, 196]
const CREAM_SHADE = [214, 160, 70]
const HULL = [96, 58, 26]

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
const easeOutBack = (t) => {
  const c1 = 2.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function makeKernel() {
  const z = 0.35 + Math.random() * 0.65
  return {
    nx: Math.random(),
    ny: Math.random(),
    z,
    s: 4.5 + z * 5.5,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    a: Math.random() * Math.PI * 2,
    va: (Math.random() - 0.5) * 0.5,
    p1: Math.random() * 6.28,
    p2: Math.random() * 6.28,
    f1: 0.15 + Math.random() * 0.2,
    f2: 0.15 + Math.random() * 0.2,
    heat: 0,
    alpha: 0,
    state: 0, // 0 kernel, 1 popped (animating / lingering)
    t: 0,
    life: 0,
    lobes: null,
    hull: null,
  }
}

// Popcorn is a cluster of lobes that start collapsed on the kernel body
// and spring out to their own target offsets, so the silhouette really changes.
function makePopcorn(k) {
  const s = k.s
  const R = s * 2.7
  const n = 5 + ((Math.random() * 4) | 0)
  const v = Math.random()
  const sx = v < 0.33 ? 1.4 : v < 0.66 ? 1 : 1.15
  const sy = v < 0.33 ? 0.8 : v < 0.66 ? 1 : 1.1
  const lobes = [{ x0: 0, y0: -s * 0.15, r0: s * 0.8, tx: 0, ty: 0, tr: R * 0.5, delay: 0 }]
  for (let i = 1; i < n; i++) {
    const ang = ((i - 1) / (n - 1)) * Math.PI * 2 + Math.random() * 0.6
    const dist = R * (0.4 + Math.random() * 0.4)
    lobes.push({
      x0: Math.cos(ang) * s * 0.2,
      y0: Math.sin(ang) * s * 0.3,
      r0: s * (0.25 + Math.random() * 0.15),
      tx: Math.cos(ang) * dist * sx,
      ty: Math.sin(ang) * dist * sy,
      tr: R * (0.28 + Math.random() * 0.2),
      delay: i * 0.014,
    })
  }
  // the hull stays stuck to whichever lobe ends up lowest
  let low = lobes[0]
  for (const l of lobes) if (l.ty + l.tr > low.ty + low.tr) low = l
  k.hull = { x0: 0, y0: s * 0.6, tx: low.tx, ty: low.ty + low.tr * 0.8, rot: (Math.random() - 0.5) * 1.2 }
  k.lobes = lobes
}

function teardropPath(ctx, s) {
  ctx.beginPath()
  ctx.moveTo(0, s)
  ctx.bezierCurveTo(s * 0.9, s * 0.3, s * 0.85, -s * 0.95, 0, -s * 0.9)
  ctx.bezierCurveTo(-s * 0.85, -s * 0.95, -s * 0.9, s * 0.3, 0, s)
  ctx.closePath()
}

function drawKernelBody(ctx, s, glow, scx, scy) {
  ctx.save()
  ctx.scale(scx, scy)
  teardropPath(ctx, s)
  const g = ctx.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.1, 0, 0, s * 1.1)
  g.addColorStop(0, rgb(mix(KERNEL_HI, [255, 190, 110], glow)))
  g.addColorStop(1, rgb(mix(KERNEL_DARK, KERNEL_HOT, glow)))
  ctx.fillStyle = g
  ctx.fill()
  // the little dent on top of a kernel
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = Math.max(0.6, s * 0.1)
  ctx.beginPath()
  ctx.arc(0, -s * 0.3, s * 0.35, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  ctx.restore()
}

function drawLobe(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r)
  g.addColorStop(0, rgb(mix(col, [255, 252, 240], 0.7)))
  g.addColorStop(0.6, rgb(col))
  g.addColorStop(1, rgb(mix(col, CREAM_SHADE, 0.55)))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawPopped(ctx, k) {
  const t = k.t
  const burstT = t - BURST_DELAY
  const R = k.s * 2.7
  for (const l of k.lobes) {
    const q = clamp((burstT - l.delay) / 0.4)
    const e = easeOutBack(q)
    drawLobe(
      ctx,
      lerp(l.x0, l.tx, e),
      lerp(l.y0, l.ty, e),
      Math.max(0.5, lerp(l.r0, l.tr, e)),
      mix(KERNEL_HOT, CREAM, clamp(q * 2.2)),
    )
  }
  const h = k.hull
  const qh = easeOutBack(clamp(burstT / 0.4))
  ctx.save()
  ctx.translate(lerp(h.x0, h.tx, qh), lerp(h.y0, h.ty, qh))
  ctx.rotate(h.rot)
  teardropPath(ctx, k.s * 0.42)
  ctx.fillStyle = rgb(HULL)
  ctx.fill()
  ctx.restore()

  // brief white flash as it bursts
  const f = clamp(burstT / 0.25)
  if (burstT > 0 && f < 1) {
    ctx.globalCompositeOperation = 'lighter'
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2)
    g.addColorStop(0, `rgba(255,240,200,${0.8 * (1 - f) * (1 - f)})`)
    g.addColorStop(1, 'rgba(255,240,200,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, R * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }
}

function makeNoise(ac) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  return buf
}

function playPop(ac, noise, vol) {
  const t = ac.currentTime
  const o = ac.createOscillator()
  const og = ac.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(260 + Math.random() * 120, t)
  o.frequency.exponentialRampToValueAtTime(70, t + 0.09)
  og.gain.setValueAtTime(vol * 0.3, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  o.connect(og).connect(ac.destination)
  o.start(t)
  o.stop(t + 0.14)

  const n = ac.createBufferSource()
  const bp = ac.createBiquadFilter()
  const ng = ac.createGain()
  n.buffer = noise
  bp.type = 'bandpass'
  bp.frequency.value = 1400 + Math.random() * 900
  ng.gain.setValueAtTime(vol * 0.5, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  n.connect(bp).connect(ng).connect(ac.destination)
  n.start(t)
}

export default function PopcornField({ onBigPop }) {
  const canvasRef = useRef(null)
  const [soundOn, setSoundOn] = useState(false)
  const soundRef = useRef(false)
  const audioRef = useRef(null)
  const bigPopRef = useRef(onBigPop)

  useEffect(() => {
    bigPopRef.current = onBigPop
  }, [onBigPop])

  function toggleSound() {
    const next = !soundOn
    if (next && !audioRef.current) {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      audioRef.current = { ac, noise: makeNoise(ac), last: 0 }
    }
    if (next) audioRef.current.ac.resume()
    soundRef.current = next
    setSoundOn(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let last = performance.now()
    let time = 0
    let kernels = []
    const popTimes = []
    const m = { x: -1e4, y: -1e4, active: false, ax: 0, ay: 0, dwell: 0 }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = clamp(Math.round((w * h) / 13000), 45, 110)
      while (kernels.length < target) {
        const k = makeKernel()
        k.x = k.nx * w
        k.y = k.ny * h
        kernels.push(k)
      }
      if (kernels.length > target) kernels = kernels.slice(0, target)
      kernels.sort((a, b) => a.z - b.z) // far ones draw first
    }

    function pop(k) {
      k.state = 1
      k.t = 0
      k.life = 8 + Math.random() * 5
      k.heat = 1
      makePopcorn(k)
      const ang = Math.random() * Math.PI * 2
      const sp = (60 + Math.random() * 60) * (0.5 + k.z * 0.5)
      k.vx += Math.cos(ang) * sp
      k.vy += Math.sin(ang) * sp - 30
      k.va = (Math.random() - 0.5) * 3

      // shockwave nudges neighbours and warms them up
      for (const o of kernels) {
        if (o === k) continue
        const dx = o.x - k.x
        const dy = o.y - k.y
        const d = Math.hypot(dx, dy)
        if (d < 110 && d > 0.01) {
          const f = 1 - d / 110
          o.vx += (dx / d) * 140 * f
          o.vy += (dy / d) * 140 * f
          if (o.state === 0) o.heat = Math.min(0.98, o.heat + 0.3 * f)
        }
      }

      const now = performance.now()
      popTimes.push(now)
      while (popTimes.length && now - popTimes[0] > 2500) popTimes.shift()
      if (popTimes.length >= 20) {
        popTimes.length = 0
        bigPopRef.current?.()
      }

      const a = audioRef.current
      if (soundRef.current && a && now - a.last > 60) {
        a.last = now
        playPop(a.ac, a.noise, 0.4 + k.z * 0.6)
      }
    }

    function update(dt) {
      if (m.active) {
        if (Math.hypot(m.x - m.ax, m.y - m.ay) > 10) {
          m.ax = m.x
          m.ay = m.y
          m.dwell = 0
        } else m.dwell += dt
      } else m.dwell = 0
      const dwellF = clamp((m.dwell - 0.25) / 0.6)

      for (const k of kernels) {
        const popped = k.state === 1
        const wander = 10 + 18 * k.z
        const tx = k.nx * w + Math.sin(time * k.f1 + k.p1) * wander
        const ty = k.ny * h + Math.cos(time * k.f2 + k.p2) * wander
        const spring = popped ? 0.9 : 5
        const damp = popped ? 1.5 : 3.2
        k.vx += (tx - k.x) * spring * dt
        k.vy += (ty - k.y) * spring * dt

        let dist = 1e5
        if (m.active) {
          const dx = k.x - m.x
          const dy = k.y - m.y
          dist = Math.hypot(dx, dy)
          if (dist < REPEL_R && dist > 0.01) {
            const f = 1 - dist / REPEL_R
            const a = f * f * 2600 * (popped ? 1.3 : 1) * (0.6 + 0.4 * k.z)
            k.vx += (dx / dist) * a * dt
            k.vy += (dy / dist) * a * dt
          }
        }

        const dm = Math.exp(-damp * dt)
        k.vx *= dm
        k.vy *= dm
        k.x += k.vx * dt
        k.y += k.vy * dt
        k.a += k.va * dt

        if (!popped) {
          k.alpha = Math.min(1, k.alpha + dt * 0.8)
          const hf = clamp(1 - dist / HEAT_R)
          if (hf > 0 && dwellF > 0) {
            k.heat += 1.4 * Math.pow(hf, 0.7) * dwellF * dt
          } else k.heat = Math.max(0, k.heat - 0.4 * dt)
          if (k.heat >= 1) pop(k)
        } else {
          k.t += dt
          k.va *= Math.exp(-0.8 * dt)
          if (k.t > k.life) {
            k.state = 0
            k.heat = 0
            k.alpha = 0
            k.lobes = null
            k.x = tx
            k.y = ty
            k.vx = 0
            k.vy = 0
            k.va = (Math.random() - 0.5) * 0.5
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      const dwellF = clamp((m.dwell - 0.25) / 0.6)
      if (m.active && dwellF > 0.02) {
        ctx.globalCompositeOperation = 'lighter'
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, HEAT_R)
        g.addColorStop(0, `rgba(255,120,30,${0.16 * dwellF})`)
        g.addColorStop(1, 'rgba(255,120,30,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(m.x, m.y, HEAT_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      for (const k of kernels) {
        const soft = k.z < 0.65 ? (0.65 - k.z) / 0.3 : 0
        ctx.save()
        if (k.state === 0) {
          let prox = 0
          if (m.active) prox = Math.pow(clamp(1 - Math.hypot(k.x - m.x, k.y - m.y) / GLOW_R), 2)
          const glow = Math.max(k.heat, prox * 0.7)
          const shake = k.heat * 1.8
          ctx.translate(k.x + Math.sin(time * 70 + k.p1) * shake, k.y + Math.cos(time * 63 + k.p2) * shake)
          ctx.rotate(k.a)
          const al = clamp(0.3 + 0.45 * k.z + 0.5 * glow) * k.alpha
          if (glow > 0.05) {
            ctx.globalAlpha = glow * 0.35 * al
            ctx.globalCompositeOperation = 'lighter'
            const r = k.s * (2.5 + glow * 4)
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
            g.addColorStop(0, 'rgba(255,130,40,1)')
            g.addColorStop(1, 'rgba(255,130,40,0)')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(0, 0, r, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalCompositeOperation = 'source-over'
          }
          ctx.globalAlpha = al
          if (soft) {
            ctx.shadowBlur = soft * 9 * dpr
            ctx.shadowColor = rgb(mix(KERNEL_DARK, KERNEL_HOT, glow))
          }
          drawKernelBody(ctx, k.s, glow, 1, 1)
        } else {
          ctx.translate(k.x, k.y)
          ctx.rotate(k.a)
          const fade = clamp((k.life - k.t) / 1.5)
          ctx.globalAlpha = (0.55 + 0.45 * k.z) * fade
          if (soft) {
            ctx.shadowBlur = soft * 9 * dpr
            ctx.shadowColor = rgb(CREAM)
          }
          if (k.t < BURST_DELAY) {
            // anticipation squash before the burst
            const u = k.t / BURST_DELAY
            drawKernelBody(ctx, k.s, 1, 1 + 0.25 * u, 1 - 0.3 * u)
          } else drawPopped(ctx, k)
        }
        ctx.restore()
      }
    }

    function frame(now) {
      let remaining = Math.min(0.5, (now - last) / 1000)
      last = now
      while (remaining > 1e-4) {
        const dt = Math.min(remaining, 1 / 60)
        remaining -= dt
        time += dt
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
      m.x = e.clientX
      m.y = e.clientY
      m.ax = m.x
      m.ay = m.y
      m.dwell = 0
      m.active = true
    }
    function onUp(e) {
      if (e.pointerType === 'touch') m.active = false
    }
    function onLeave() {
      m.active = false
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    resize()
    if (reduceMotion) {
      // static, non-interactive field: draw once (and on resize), no animation loop
      update(0.5)
      draw()
      const redraw = () => {
        resize()
        draw()
      }
      window.addEventListener('resize', redraw)
      return () => window.removeEventListener('resize', redraw)
    }
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
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="popcorn-canvas" aria-hidden="true" />
      <button
        type="button"
        className="sound-toggle"
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Mute pop sounds' : 'Unmute pop sounds'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          {soundOn ? (
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          ) : (
            <path d="M22 9l-6 6M16 9l6 6" />
          )}
        </svg>
      </button>
    </>
  )
}

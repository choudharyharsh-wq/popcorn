import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

const REPEL_R = 120
const HEAT_R = 150
const GLOW_R = 230
const BURST_DELAY = 0.09

const KERNEL_DARK = [62, 40, 22]
const KERNEL_HI = [112, 76, 40]
const KERNEL_HOT = [232, 137, 43]
const CREAM = [247, 232, 196]
// used only by the drawn-lobe popcorn (disabled, see below)
// const CREAM_SHADE = [214, 160, 70]
// const HULL = [96, 58, 26]

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

// Real popcorn photos (transparent cut-outs). Every pop uses one of these.
// They load after the page has finished, at low priority, so they never compete
// with the hero artwork.
const SPRITE_COUNT = 6
let SPRITES = []

function loadSprites() {
  if (SPRITES.length || typeof Image === 'undefined') return
  SPRITES = Array.from({ length: SPRITE_COUNT }, (_, i) => {
    const img = new Image()
    img.fetchPriority = 'low'
    img.decoding = 'async'
    img.src = `/popcorn/p${i + 1}.webp`
    return img
  })
}

function pickSprite() {
  const ready = SPRITES.filter((img) => img.complete && img.naturalWidth)
  return ready.length ? ready[(Math.random() * ready.length) | 0] : null
}

function makePopcorn(k) {
  k.sprite = pickSprite()
  k.flip = Math.random() < 0.5 ? -1 : 1
  k.tilt = (Math.random() - 0.5) * 1.2
}

/* ---- Drawn-lobe popcorn (the old circles). Disabled; to bring it back:
 * 1. uncomment CREAM_SHADE and HULL at the top, drawLobe below, and this function,
 * 2. in makePopcorn pick it for some pops (e.g. when Math.random() < 0.6),
 * 3. in drawPopped uncomment the lobe and hull blocks.
 *
// Popcorn is a cluster of lobes that start collapsed on the kernel body
// and spring out to their own target offsets, so the silhouette really changes.
function makeLobePopcorn(k) {
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
*/

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

/* disabled with the lobe popcorn above
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
*/

function drawSprite(ctx, k, burstT) {
  const img = k.sprite
  if (!img) return
  const long = k.s * 8.2
  const ratio = img.naturalWidth / img.naturalHeight
  const w = ratio >= 1 ? long : long * ratio
  const h = ratio >= 1 ? long / ratio : long
  // springs out of the kernel: small, overshoots, settles
  const e = easeOutBack(clamp(burstT / 0.45))
  const sc = lerp(0.18, 1, e)
  ctx.save()
  ctx.rotate(k.tilt * (1 - e))
  ctx.scale(k.flip * sc, sc)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
}

function drawPopped(ctx, k) {
  const t = k.t
  const burstT = t - BURST_DELAY
  const R = k.s * 2.7
  drawSprite(ctx, k, burstT)

  /* ---- drawn-lobe popcorn (disabled): replaces drawSprite for pops that use makeLobePopcorn
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
  {
    const h = k.hull
    const qh = easeOutBack(clamp(burstT / 0.4))
    ctx.save()
    ctx.translate(lerp(h.x0, h.tx, qh), lerp(h.y0, h.ty, qh))
    ctx.rotate(h.rot)
    teardropPath(ctx, k.s * 0.42)
    ctx.fillStyle = rgb(HULL)
    ctx.fill()
    ctx.restore()
  }
  */

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

// Real popcorn pops, cut from a CC0 field recording (see public/sounds/CREDITS.txt).
// pops.mp3 holds 12 different pops; each entry is [start, length] in seconds.
const POP_URL = '/sounds/pops.mp3'
const POP_SLICES = [
  [0.08, 0.1946],
  [0.3946, 0.1566],
  [0.6712, 0.1407],
  [0.9318, 0.116],
  [1.1678, 0.116],
  [1.4038, 0.197],
  [1.7208, 0.116],
  [1.9568, 0.1267],
  [2.2034, 0.2079],
  [2.5314, 0.1578],
  [2.8092, 0.1404],
  [3.0696, 0.326],
]

function loadPopSamples(entry) {
  fetch(POP_URL)
    .then((r) => r.arrayBuffer())
    .then((b) => entry.ac.decodeAudioData(b))
    .then((buf) => {
      entry.buf = buf
    })
    .catch(() => {}) // keep the synthesized pop if the file can't be loaded
}

let lastSlice = -1

// pan: -1 (left) to 1 (right), taken from where the kernel is on the page
function playSample(ac, buf, vol, pan) {
  let i = (Math.random() * POP_SLICES.length) | 0
  if (i === lastSlice) i = (i + 1) % POP_SLICES.length // never the same pop twice in a row
  lastSlice = i
  const [at, dur] = POP_SLICES[i]
  const src = ac.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = 0.9 + Math.random() * 0.24 // slight pitch change: every pop sounds different
  const g = ac.createGain()
  g.gain.value = vol * (0.65 + Math.random() * 0.35)
  let out = g
  src.connect(g)
  if (ac.createStereoPanner) {
    const p = ac.createStereoPanner()
    p.pan.value = pan
    g.connect(p)
    out = p
  }
  out.connect(ac.destination)
  src.start(ac.currentTime, Math.max(0, at - 0.02), dur + 0.04)
}

// Fallback while the recording is still loading (or if it fails): a synthesized pop.
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

const noopSubscribe = () => () => {}

// The field covers the whole page, not just the first screen: kernels live in page
// coordinates and scroll with the content, while one viewport-sized canvas (rendered
// straight into <body>) draws the part you can see.
export default function PopcornField({ onBigPop }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
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
      audioRef.current = { ac, noise: makeNoise(ac), buf: null, last: 0 }
      loadPopSamples(audioRef.current)
    }
    if (next) audioRef.current.ac.resume()
    soundRef.current = next
    setSoundOn(next)
  }

  useEffect(() => {
    const start = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(loadSprites, { timeout: 2500 })
      else setTimeout(loadSprites, 800)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => window.removeEventListener('load', start)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = 0 // page (world) width
    let h = 0 // page (world) height
    let vw = 0 // viewport
    let vh = 0
    let dpr = 1
    let raf = 0
    let last = performance.now()
    let time = 0
    let kernels = []
    const popTimes = []
    // x/y are page coordinates; cx/cy is where the pointer is in the window
    const m = { x: -1e4, y: -1e4, cx: -1e4, cy: -1e4, active: false, ax: 0, ay: 0, dwell: 0 }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      vw = window.innerWidth
      vh = window.innerHeight
      w = document.documentElement.clientWidth
      h = Math.max(document.documentElement.scrollHeight, vh)
      canvas.width = vw * dpr
      canvas.height = vh * dpr
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      const target = clamp(Math.round((w * h) / 13000), 45, 220)
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
      if (soundRef.current && a && now - a.last > 45) {
        a.last = now
        const vol = 0.4 + k.z * 0.6
        if (a.buf) playSample(a.ac, a.buf, vol, clamp((k.x / w) * 2 - 1, -1, 1) * 0.7)
        else playPop(a.ac, a.noise, vol)
      }
    }

    function update(dt) {
      m.x = m.cx
      m.y = m.cy + window.scrollY
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
      const sy = window.scrollY
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, -sy * dpr)
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
        if (k.y < sy - 140 || k.y > sy + vh + 140) continue // off screen
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
      m.cx = e.clientX
      m.cy = e.clientY
      if (e.pointerType !== 'touch' || e.buttons) m.active = true
    }
    function onDown(e) {
      m.cx = e.clientX
      m.cy = e.clientY
      m.ax = m.cx
      m.ay = m.cy + window.scrollY
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
      window.addEventListener('scroll', draw, { passive: true })
      return () => {
        window.removeEventListener('resize', redraw)
        window.removeEventListener('scroll', draw)
      }
    }
    window.addEventListener('resize', resize)
    // the page can grow or shrink (fonts, images, rotation): keep the field matched to it
    const pageObserver = new ResizeObserver(resize)
    pageObserver.observe(document.body)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('blur', onLeave)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      pageObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
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
    </>,
    document.body,
  )
}

import popsUrl from './assets/sounds/pops.mp3'

export function makeNoise(ac) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  return buf
}

// Real popcorn pops, cut from a CC0 field recording (see src/assets/sounds/CREDITS.txt).
// pops.mp3 holds 12 different pops; each entry is [start, length] in seconds.
const POP_URL = popsUrl
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

export function loadPopSamples(entry) {
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
export function playSample(ac, buf, vol, pan) {
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
export function playPop(ac, noise, vol) {
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

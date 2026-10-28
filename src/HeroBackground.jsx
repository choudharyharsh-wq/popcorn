import { useEffect, useRef } from 'react'

// Home page backdrop, rebuilt from the Figma "hero" frame (1512 x 1215).
// Every size is a multiple of --u (one Figma px), so the artwork scales with
// the page width; the wordmark hangs from the top and the strip sits on the bottom edge.

export default function HeroBackground() {
  const ref = useRef(null)

  // The artwork is fitted to the screen (width and height), so on wide screens
  // it ends up narrower than the page. --sx stretches the strip sideways to
  // keep it edge to edge.
  useEffect(() => {
    const el = ref.current
    const box = el.parentElement
    const landing = box.parentElement
    const update = () => {
      const { width, height } = box.getBoundingClientRect()
      const u = Math.min(width / 1512, height / 1215)
      landing.style.setProperty('--sx', String(Math.max(1, width / (1512 * u))))
      landing.style.setProperty('--sy', String(Math.max(1, height / (1215 * u))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="hero-bg" ref={ref} aria-hidden="true">
      <div className="hero-plate" />

      <div className="hero-art">

      <svg className="hero-design" viewBox="0 0 1273 403" overflow="visible">
        <defs>
          <linearGradient id="design-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="design-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff9a5c" stopOpacity="0.9" />
            <stop offset="1" stopColor="#7a3b22" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="design-ph" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4a2515" />
            <stop offset="0.55" stopColor="#8a4a28" />
            <stop offset="1" stopColor="#f0a45a" />
          </linearGradient>
          <clipPath id="design-clip">
            <text x="0" y="418.9">Design</text>
          </clipPath>
          <filter id="design-blur" x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
        </defs>
        <g className="hero-design-text">
          <rect x="-87" y="-27" width="1440" height="590" fill="url(#design-ph)" clipPath="url(#design-clip)" />
          <image
            href="/hero/design-fill.webp"
            x="-86.69"
            y="-27.28"
            width="1440"
            height="590"
            preserveAspectRatio="none"
            clipPath="url(#design-clip)"
          />
          <text className="hero-design-pulse" fill="url(#design-fill)" filter="url(#design-blur)" x="0" y="418.9">Design</text>
          <text fill="none" stroke="url(#design-stroke)" strokeWidth="1.1" x="0" y="418.9">Design</text>
        </g>
      </svg>

      <img className="hero-pop" src="/hero/pop.svg" alt="" />
      </div>

      <div className="hero-strip">
       <div className="hero-strip-inner">
        <img className="hero-strip-glow" src="/hero/strip-glow.svg" alt="" />
        <img className="hero-strip-shape" src="/hero/strip-shape.svg" alt="" />
        <div className="hero-tiles">
          <div className="hero-tiles-mask" />
        </div>
        {/* same grid, unmasked, only along the bottom: fills the corners the rotated edge doesn't reach */}
        <div className="hero-tiles hero-tiles-base">
          <div className="hero-tiles-plain" />
        </div>
       </div>
      </div>
    </div>
  )
}

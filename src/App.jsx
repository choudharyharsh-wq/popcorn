import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import PopcornField from './PopcornField.jsx'
import HeroBackground from './HeroBackground.jsx'
import { WiggleIcon, QuillIcon, PokeIcon, SquishIcon, GlintIcon, DriftIcon, NudgeIcon, FlipIcon } from './ToolIcons.jsx'
import './App.css'

// `name` is what the tool actually is (tooltips, screen readers); `label` is the friendly name on the tile.
const tools = [
  {
    name: 'Rive Previewer',
    label: 'Wiggle',
    tint: 'rgba(192, 132, 252, 0.6)',
    path: '/tool1',
    favicon: '/favicons/tool1.svg',
    url: 'https://joyful-beignet-8e4f63.netlify.app/',
    Icon: WiggleIcon,
  },
  {
    name: 'Copy Writer',
    label: 'Quill',
    tint: 'rgba(251, 146, 60, 0.55)',
    path: '/tool2',
    favicon: '/favicons/tool2.svg',
    url: 'https://copy-writing-platform.vercel.app/',
    Icon: QuillIcon,
  },
  {
    name: 'Interaction Library',
    label: 'Poke',
    tint: 'rgba(56, 189, 248, 0.5)',
    path: '/tool3',
    favicon: '/favicons/tool3.svg',
    url: 'https://coruscating-bunny-94b291.netlify.app/',
    Icon: PokeIcon,
  },
  {
    name: 'Pop Compress',
    label: 'Squish',
    tint: 'rgba(99, 102, 241, 0.6)',
    path: '/tool4',
    favicon: '/favicons/tool4.svg',
    url: 'https://magical-puffpuff-fe79ba.netlify.app/',
    Icon: SquishIcon,
  },
]

// not built yet: shown as placeholders so the grid reads as eight
const soon = [
  { label: 'Glint', Icon: GlintIcon },
  { label: 'Drift', Icon: DriftIcon },
  { label: 'Nudge', Icon: NudgeIcon },
  { label: 'Flip', Icon: FlipIcon },
]

// placeholder copy, 40 words
const INTRO_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor.'

const HOME_FAVICON = '/favicons/home.svg'
const HOME_TITLE = 'popcorn.design'

function usePageIdentity(favicon, title) {
  useEffect(() => {
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = favicon
    document.title = title
  }, [favicon, title])
}

function ToolFrame({ tool }) {
  usePageIdentity(tool.favicon, `${tool.name} · ${HOME_TITLE}`)
  const { url } = tool
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  // launch splash: the tool's icon pops in, then zooms away once the tool has loaded
  // (and the intro has had a moment to play)
  const [minShown, setMinShown] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [finished, setFinished] = useState(false)
  const leaving = (loaded && minShown) || gaveUp
  const phase = finished ? 'done' : leaving ? 'out' : 'in'
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 12000)
    const min = setTimeout(() => setMinShown(true), 900)
    const max = setTimeout(() => setGaveUp(true), 8000)
    return () => {
      clearTimeout(timer)
      clearTimeout(min)
      clearTimeout(max)
    }
  }, [])
  useEffect(() => {
    if (!leaving) return
    const done = setTimeout(() => setFinished(true), 750)
    return () => clearTimeout(done)
  }, [leaving])
  return (
    <>
      <iframe
        src={url}
        onLoad={() => setLoaded(true)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 'none',
        }}
        title={tool.name}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="clipboard-write; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
      />
      {phase !== 'done' && (
        <div className={`launch launch-${phase}`} style={{ '--tint': tool.tint }} aria-hidden="true">
          <div className="launch-icon">
            <tool.Icon />
          </div>
          <div className="launch-name">{tool.label}</div>
        </div>
      )}
      {slow && !loaded && (
        <div className="frame-notice" role="status">
          <span>this tool is taking a while to load.</span>
          <a href={url} target="_blank" rel="noopener noreferrer">open in a new tab</a>
          <Link to="/">back home</Link>
        </div>
      )}
    </>
  )
}

// Tap: let the icon's pop and ripple play first, then open the tool in a new tab.
// Opening is delayed a beat (still counts as the same click for popup rules), and
// ctrl/cmd/shift/middle clicks keep their normal browser behaviour.
const RIPPLE_MS = 600

function openTool(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const el = e.currentTarget
  const href = el.href
  e.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const open = () => {
    el.classList.remove('launching')
    const w = window.open(href, '_blank')
    if (w) w.opener = null
    else window.location.assign(href) // popup blocked: fall back to this tab
  }
  if (reduce) return open()
  el.classList.remove('launching')
  void el.offsetWidth
  el.classList.add('launching')
  setTimeout(open, RIPPLE_MS)
}

function Home() {
  usePageIdentity(HOME_FAVICON, HOME_TITLE)

  return (
    <div className="landing">
    {/* first, so its sticky screen-sized layer starts at the top of the page */}
    <PopcornField />
    <div className="home">
      <HeroBackground />
      <h1 className="sr-only">Pop Design: web tools by the pop upi design team</h1>
      <p className="hero-caption">Tools by POPdesign</p>
    </div>

    <section className="intro" aria-label="About Pop Design">
      <div className="intro-bg" aria-hidden="true">
        <div className="intro-tiles">
          <div className="intro-tiles-inner" />
        </div>
      </div>
      <h2 className="intro-title">Pick your POPcorn</h2>
      <nav className="grid" aria-label="Tools">
        {tools.map((t) => (
          <Link
            key={t.name}
            to={t.path}
            target="_blank"
            rel="noopener noreferrer"
            className="tool"
            title={t.name}
            aria-label={`${t.label}: ${t.name} (opens in a new tab)`}
            onClick={openTool}
          >
            <t.Icon />
            <div className="label">{t.label}</div>
          </Link>
        ))}
        {soon.map((t) => (
          <div key={t.label} className="tool soon" aria-label={`${t.label}: coming soon`}>
            <t.Icon />
            <div className="label">{t.label}</div>
          </div>
        ))}
      </nav>
      <p className="intro-text">{INTRO_TEXT}</p>
      <div className="footer">
        by <a href="https://popupi.com">pop upi</a>
        {' · '}
        <a href="https://popupi.com">contact</a>
      </div>
    </section>
    </div>
  )
}

function NotFound() {
  usePageIdentity(HOME_FAVICON, `Page not found · ${HOME_TITLE}`)
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  return (
    <main className="notfound">
      <div className="notfound-code" aria-hidden="true">404</div>
      <h1 className="notfound-title">
        <span className="sr-only">404: </span>this <span>kernel</span> never popped
      </h1>
      <Link to="/" className="notfound-link">← back to popcorn.design</Link>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {tools.map((t) => (
        <Route key={t.path} path={t.path} element={<ToolFrame tool={t} />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

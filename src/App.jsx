import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import PopcornField from './PopcornField.jsx'
import HeroBackground from './HeroBackground.jsx'
import './App.css'

const tools = [
  {
    name: 'Rive Previewer',
    path: '/tool1',
    favicon: '/favicons/tool1.svg',
    url: 'https://joyful-beignet-8e4f63.netlify.app/',
    cls: 't1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 21l15-15l-3-3l-15 15l0 3l3 0z" />
        <path d="M15 6l3 3" />
        <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0-2 2a2 2 0 0 0-2-2a2 2 0 0 0 2-2" />
        <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0-2 2a2 2 0 0 0-2-2a2 2 0 0 0 2-2" />
      </svg>
    ),
  },
  {
    name: 'Copy Writer',
    path: '/tool2',
    favicon: '/favicons/tool2.svg',
    url: 'https://copy-writing-platform.vercel.app/',
    cls: 't2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3l0 7l6 0l-8 11l0-7l-6 0l8-11" />
      </svg>
    ),
  },
  {
    name: 'Interaction Library',
    path: '/tool3',
    favicon: '/favicons/tool3.svg',
    url: 'https://coruscating-bunny-94b291.netlify.app/',
    cls: 't3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <circle cx="9" cy="9" r="2" />
        <circle cx="19" cy="7" r="2" />
        <circle cx="14" cy="15" r="2" />
      </svg>
    ),
  },
  {
    name: 'Pop Compress',
    path: '/tool4',
    favicon: '/favicons/tool4.svg',
    url: 'https://magical-puffpuff-fe79ba.netlify.app/',
    cls: 't4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.582 9 8c0 1.06-.474 2.078-1.318 2.828S17.938 15 16.5 15H14a2 2 0 0 0-1 3.75A1.3 1.3 0 0 1 12 21" />
        <circle cx="7.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="12" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="16.5" cy="10.5" r=".5" fill="currentColor" />
      </svg>
    ),
  },
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
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 12000)
    return () => clearTimeout(timer)
  }, [])
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

function Home() {
  usePageIdentity(HOME_FAVICON, HOME_TITLE)

  return (
    <div className="landing">
    <div className="home">
      <HeroBackground />
      <PopcornField />
      <main className="page">
        <h1 className="sr-only">Pop Design: web tools by the pop upi design team</h1>

        <nav className="grid" aria-label="Tools">
          {tools.map((t) => (
            <Link key={t.name} to={t.path} className={`tool ${t.cls}`}>
              <div className="icon">{t.icon}</div>
              <div className="label">{t.name}</div>
            </Link>
          ))}
        </nav>

        <div className="footer">
          by <a href="https://popupi.com">pop upi</a>
          {' · '}
          <a href="https://popupi.com">contact</a>
        </div>
      </main>
    </div>

    <section className="intro" aria-label="About Pop Design">
      <div className="intro-tiles" aria-hidden="true">
        <div className="intro-tiles-inner">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
            <div className="hero-tile-row" key={r}>
              {[0, 1, 2, 3, 4].map((i) => (
                <img key={i} src="/hero/strip-texture.webp" alt="" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="intro-text">{INTRO_TEXT}</p>
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

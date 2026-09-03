import { Routes, Route, Link } from 'react-router-dom'
import './App.css'

const tools = [
  {
    name: 'Rive Previewer',
    path: '/tool1',
    url: 'https://www.popcorn.design',
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
    url: 'https://copy-writing-platform.vercel.app/',
    cls: 't2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3l0 7l6 0l-8 11l0-7l-6 0l8-11" />
      </svg>
    ),
  },
  {
    name: 'Tool three',
    path: '/tool3',
    url: 'https://example.com',
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
    name: 'Tool four',
    path: '/tool4',
    url: 'https://example.com',
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

function ToolFrame({ url }) {
  return (
    <iframe
      src={url}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
      }}
      title="Tool"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    />
  )
}

function Home() {
  return (
    <div className="page">
      <div className="brand">pop upi</div>
      <h1 className="title">
        grab your <span>popcorn</span>
      </h1>
      <p className="sub">sit back, pick a tool, enjoy the show.</p>

      <div className="grid">
        {tools.map((t) => (
          <Link key={t.name} to={t.path} className={`tool ${t.cls}`}>
            <div className="icon">{t.icon}</div>
            <div className="label">{t.name}</div>
          </Link>
        ))}
      </div>

      <div className="footer">
        by <a href="https://popupi.com">pop upi</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {tools.map((t) => (
        <Route key={t.path} path={t.path} element={<ToolFrame url={t.url} />} />
      ))}
    </Routes>
  )
}

export default App

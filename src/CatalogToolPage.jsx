import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import popLogoUrl from './assets/hero/pop.svg'
import WorkflowCanvas from './WorkflowCanvas.jsx'
import MachineRive from './MachineRive.jsx'
import { N8N_WORKFLOWS } from './n8nWorkflows.js'
import './CatalogToolPage.css'

// Same three phases as the write-up, but framed as the tool's pipeline steps. `json` is the
// exported n8n workflow in public/catalog/ — the download button lights up once it's set.
const PHASES = [
  {
    key: 'edit',
    n: '01',
    name: 'Edit',
    json: '/catalog/edit-workflow.json',
  },
  {
    key: 'check',
    n: '02',
    name: 'Check',
    json: '/catalog/check-workflow.json',
  },
  {
    key: 'fix',
    n: '03',
    name: 'Fix',
    json: '/catalog/fix-workflow.json',
  },
]

// Sample outputs, independent of which phase is selected. Each category is 6 real
// product photos cropped from app screenshots — before (vendor) and after (edited).
const slot = (dir, kind, n) => Array.from({ length: n }, (_, i) => `/catalog/pairs/${dir}-${kind}-${i + 1}.webp`)
const CATEGORIES = [
  { label: 'T-shirts', before: slot('tshirts', 'before', 6), after: slot('tshirts', 'after', 6) },
  { label: 'Caps', before: slot('caps', 'before', 6), after: slot('caps', 'after', 6) },
  { label: 'Belts', before: slot('belts', 'before', 6), after: slot('belts', 'after', 6) },
]

function PhaseTabs({ phases, active, onPick }) {
  return (
    <div className="ct-float ct-tabs">
      {phases.map((p, n) => (
        <button type="button" key={p.key} className={`ct-tab${n === active ? ' is-on' : ''}`} onClick={() => onPick(n)}>
          <span className="ct-tab-n">{p.n}</span>
          {p.name}
        </button>
      ))}
    </div>
  )
}

function OutputPanel({ categories }) {
  const [i, setI] = useState(0)
  const [pos, setPos] = useState(50)
  const cat = categories[i]
  const animatingRef = useRef(true)

  useEffect(() => {
    animatingRef.current = true

    // segments: [startMs, endMs, startPos, endPos]
    const segments = [
      [500,  2000,  50, 100],   // middle → right (1500ms)
      [2000, 2300, 100, 100],   // pause at right (300ms)
      [2300, 4800, 100,   0],   // right → left   (2500ms)
      [4800, 5100,   0,   0],   // pause at left  (300ms)
      [5100, 6300,   0,  30],   // left → 30%     (1200ms)
    ]
    const totalMs = 6300
    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    let rafId
    let startTime

    function animate(timestamp) {
      if (!animatingRef.current) return
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      if (elapsed >= totalMs) {
        setPos(30)
        return
      }

      let newPos = 50
      for (const [t0, t1, p0, p1] of segments) {
        if (elapsed < t0) { newPos = p0; break }
        if (elapsed < t1) {
          const t = (elapsed - t0) / (t1 - t0)
          newPos = p0 + (p1 - p0) * easeInOut(t)
          break
        }
        newPos = p1
      }

      setPos(newPos)
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => {
      animatingRef.current = false
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="ct-output">
      <div className="ct-output-head">
        <span className="ct-panel-label">Output</span>
      </div>
      <div className="ct-output-tabs" role="tablist" aria-label="Sample category">
        {categories.map((c, n) => (
          <button key={c.label} type="button" role="tab" aria-selected={n === i} className={`ct-tab${n === i ? ' is-on' : ''}`} onClick={() => setI(n)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="ct-compare">
        <div className="ct-compare-grid">
          {cat.after.map((src, n) => (
            <div className="ct-compare-tile" key={`${cat.label}-after-${n}`}>
              <img src={src} alt={`${cat.label}, after`} draggable="false" />
            </div>
          ))}
        </div>
        <div className="ct-compare-grid ct-compare-before" style={{ '--pos': `${pos}%` }}>
          {cat.before.map((src, n) => (
            <div className="ct-compare-tile" key={`${cat.label}-before-${n}`}>
              <img src={src} alt={`${cat.label}, before`} draggable="false" />
            </div>
          ))}
        </div>
        <span className="ct-compare-line" style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="ct-compare-knob" />
        </span>
        <input
          className="ct-compare-range"
          type="range"
          min="0"
          max="100"
          value={pos}
          onChange={(e) => { animatingRef.current = false; setPos(Number(e.target.value)) }}
          aria-label={`Compare before and after: ${cat.label}`}
        />
      </div>
    </div>
  )
}

export default function CatalogToolPage() {
  const [active, setActive] = useState(0)
  const [view, setView] = useState('flows')
  const phase = PHASES[active]
  const isFlows = view === 'flows'

  return (
    <main className="ct">
      <header className="ct-top">
        <Link to="/" className="ct-logo" aria-label="popcorn.design home">
          <img src={popLogoUrl} alt="" />
        </Link>
      </header>

      <div className="ct-body">
        <div className="ct-stage">
          <div className="ct-stage-head">
            <div className="ct-title">
              AI Cataloging Tool
              <Link to="/stories/ai-cataloging" className="ct-title-chevron" aria-label="Read the write-up">
                <span className="ct-chevron-text">Read more</span>
                <span className="ct-chevron-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="ct-view-tabs" role="tablist" aria-label="View">
              <button type="button" role="tab" aria-selected={isFlows} className={`ct-view-tab${isFlows ? ' is-on' : ''}`} onClick={() => setView('flows')}>
                n8n flows
              </button>
              <button type="button" role="tab" aria-selected={!isFlows} className={`ct-view-tab ct-view-tab-fun${!isFlows ? ' is-on' : ''}`} onClick={() => setView('eli5')}>
                Explain it to me like I'm 5 🍼
              </button>
            </div>
          </div>

          <div className="ct-stage-body">
            {isFlows ? (
              <>
                <WorkflowCanvas key={phase.key} workflow={N8N_WORKFLOWS[phase.key]} />

                <PhaseTabs phases={PHASES} active={active} onPick={setActive} />

                <a
                  className={`ct-float ct-download${phase.json ? '' : ' is-disabled'}`}
                  href={phase.json ?? undefined}
                  download={!!phase.json}
                  aria-disabled={!phase.json}
                  title={phase.json ? `Download ${phase.name} workflow (.json)` : 'Workflow export coming soon'}
                  onClick={(e) => !phase.json && e.preventDefault()}
                >
                  ↓ Download .json
                </a>
              </>
            ) : (
              <MachineRive />
            )}
          </div>
        </div>

        <OutputPanel categories={CATEGORIES} />
      </div>
    </main>
  )
}

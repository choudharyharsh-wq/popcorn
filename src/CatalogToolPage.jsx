import { useState } from 'react'
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
  return (
    <div className="ct-output">
      <div className="ct-output-head">
        <span className="ct-panel-label">Output</span>
        <span className="ct-status">● pass</span>
      </div>
      <div className="ct-output-tabs" role="tablist" aria-label="Sample category">
        {categories.map((c, n) => (
          <button key={c.label} type="button" role="tab" aria-selected={n === i} className={`ct-output-tab${n === i ? ' is-on' : ''}`} onClick={() => setI(n)}>
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
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare before and after: ${cat.label}`}
        />
      </div>
    </div>
  )
}

export default function CatalogToolPage() {
  const [active, setActive] = useState(0)
  const [eli5, setEli5] = useState(false)
  const phase = PHASES[active]
  return (
    <main className="ct">
      <header className="ct-top">
        <Link to="/" className="ct-logo" aria-label="popcorn.design home">
          <img src={popLogoUrl} alt="" />
        </Link>
        <div className="ct-title">
          <span className="ct-live" aria-hidden="true" />
          AI Cataloging Tool
        </div>
        <div className="ct-top-mid">
          <button type="button" className={`ct-eli5${eli5 ? ' is-on' : ''}`} onClick={() => setEli5((v) => !v)}>
            {eli5 ? '‹ back to the boring version' : "Explain it to me like I'm 5 🍼"}
          </button>
        </div>
        <div className="ct-top-links">
          <Link to="/stories/ai-cataloging" className="ct-top-link">
            Read the write-up
          </Link>
        </div>
      </header>

      {eli5 ? (
        <div className="ct-body">
          <MachineRive />
        </div>
      ) : (
        <div className="ct-body">
          <div className="ct-stage">
            <WorkflowCanvas key={phase.key} workflow={N8N_WORKFLOWS[phase.key]} />

            <PhaseTabs phases={PHASES} active={active} onPick={setActive} />

            <span className="ct-float ct-hint">scroll to zoom · drag to pan</span>

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
          </div>

          <OutputPanel categories={CATEGORIES} />
        </div>
      )}
    </main>
  )
}

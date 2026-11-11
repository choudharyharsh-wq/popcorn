import { useState } from 'react'
import { Link } from 'react-router-dom'
import popLogoUrl from './assets/hero/pop.svg'
import WorkflowCanvas from './WorkflowCanvas.jsx'
import { N8N_WORKFLOWS } from './n8nWorkflows.js'
import './CatalogToolPage.css'

// Same three phases as the write-up, but framed as the tool's pipeline steps. `json` is the
// exported n8n workflow in public/catalog/ — the download button lights up once it's set.
const PHASES = [
  {
    key: 'edit',
    n: '01',
    name: 'Edit',
    json: null,
  },
  {
    key: 'check',
    n: '02',
    name: 'Check',
    json: null,
  },
  {
    key: 'fix',
    n: '03',
    name: 'Fix',
    json: null,
  },
]

// Sample outputs, independent of which phase is selected.
const PAIRS = [
  { label: 'Footwear', before: '/catalog/pairs/sneakers-before.webp', after: '/catalog/pairs/sneakers-after.webp' },
  { label: 'T-shirts', before: '/catalog/pairs/tshirts-before.webp', after: '/catalog/pairs/tshirts-after.webp' },
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

function OutputPanel({ pairs }) {
  const [i, setI] = useState(0)
  const [show, setShow] = useState('after')
  const pair = pairs[i]
  return (
    <div className="ct-output">
      <div className="ct-output-head">
        <span className="ct-panel-label">Output</span>
        <span className="ct-status">● pass</span>
      </div>
      <div className="ct-output-tabs" role="tablist" aria-label="Sample category">
        {pairs.map((p, n) => (
          <button key={p.label} type="button" role="tab" aria-selected={n === i} className={`ct-output-tab${n === i ? ' is-on' : ''}`} onClick={() => setI(n)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="ct-hero">
        <div className="ct-hero-toggle" role="tablist" aria-label="Before or after">
          <button type="button" role="tab" aria-selected={show === 'before'} className={show === 'before' ? 'is-on' : ''} onClick={() => setShow('before')}>
            Before
          </button>
          <button type="button" role="tab" aria-selected={show === 'after'} className={show === 'after' ? 'is-on' : ''} onClick={() => setShow('after')}>
            After
          </button>
        </div>
        <div className="ct-hero-frame">
          <img key={`${pair.label}-before`} src={pair.before} alt={`${pair.label}, before`} draggable="false" className={show === 'before' ? 'is-shown' : ''} />
          <img key={`${pair.label}-after`} src={pair.after} alt={`${pair.label}, after`} draggable="false" className={show === 'after' ? 'is-shown' : ''} />
        </div>
      </div>
    </div>
  )
}

export default function CatalogToolPage() {
  const [active, setActive] = useState(0)
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
        <div className="ct-top-links">
          <Link to="/stories/ai-cataloging" className="ct-top-link">
            Read the write-up
          </Link>
        </div>
      </header>

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

        <OutputPanel pairs={PAIRS} />
      </div>
    </main>
  )
}

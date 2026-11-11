import { useState } from 'react'
import { Link } from 'react-router-dom'
import popLogoUrl from './assets/hero/pop.svg'
import './CatalogToolPage.css'

// Same three phases as the write-up, but framed as the tool's pipeline steps. `json` is the
// exported n8n workflow in public/catalog/ — the download button lights up once it's set.
const PHASES = [
  {
    key: 'edit',
    n: '01',
    name: 'Edit',
    model: 'Gemini 2.5 Flash',
    desc: 'Places every product on a clean studio background.',
    image: '/catalog/phase-1-editing.png',
    json: null,
  },
  {
    key: 'check',
    n: '02',
    name: 'Check',
    model: 'Gemini 2.5 Flash',
    desc: 'Compares the original and the edit before anything ships.',
    image: '/catalog/phase-2-qc.png',
    json: null,
  },
  {
    key: 'fix',
    n: '03',
    name: 'Fix',
    model: 'Gemini 3 Pro',
    desc: 'Re-edits anything that failed, with the failure reason attached.',
    image: '/catalog/phase-3-reedit.png',
    json: null,
  },
]

// Sample outputs on the right, independent of which phase is selected.
const PAIRS = [
  { label: 'Footwear', before: '/catalog/pairs/sneakers-before.webp', after: '/catalog/pairs/sneakers-after.webp' },
  { label: 'T-shirts', before: '/catalog/pairs/tshirts-before.webp', after: '/catalog/pairs/tshirts-after.webp' },
]

const CONFIG_ROWS = [
  { label: 'Source', value: 'Google Sheet' },
  { label: 'Batch size', value: '500 images' },
  { label: 'Throughput', value: '~15 / min' },
]

function InputsPanel({ phases, active, onPick }) {
  return (
    <div className="ct-panel ct-inputs">
      <div className="ct-panel-head">
        <span className="ct-panel-label">Inputs</span>
      </div>
      <ul className="ct-phase-list">
        {phases.map((p, n) => (
          <li key={p.key}>
            <button type="button" className={`ct-phase${n === active ? ' is-on' : ''}`} onClick={() => onPick(n)}>
              <span className="ct-phase-n">{p.n}</span>
              <span className="ct-phase-body">
                <span className="ct-phase-name">{p.name}</span>
                <span className="ct-phase-desc">{p.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="ct-config">
        <div className="ct-config-row">
          <span>Model</span>
          <span>{phases[active].model}</span>
        </div>
        {CONFIG_ROWS.map((r) => (
          <div className="ct-config-row" key={r.label}>
            <span>{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowPanel({ phase }) {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="ct-panel ct-workflow">
      <div className="ct-panel-head">
        <span className="ct-panel-label">Workflow</span>
        <span className="ct-zoom">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} aria-label="Zoom out" disabled={zoom <= 1}>
            −
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))} aria-label="Zoom in" disabled={zoom >= 3}>
            +
          </button>
        </span>
      </div>
      <div className="ct-window">
        <div className="ct-window-bar">
          <span className="ct-dots" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="ct-window-name">n8n · {phase.name}</span>
        </div>
        <div className="ct-canvas-wrap">
          <div className="ct-canvas" tabIndex={0} aria-label={`${phase.name} workflow, scrollable`}>
            <img key={phase.image} src={phase.image} alt={`n8n workflow for ${phase.name}`} style={{ width: `${zoom * 100}%` }} draggable="false" />
          </div>
          <a
            className={`ct-download${phase.json ? '' : ' is-disabled'}`}
            href={phase.json ?? undefined}
            download={!!phase.json}
            aria-disabled={!phase.json}
            title={phase.json ? `Download ${phase.name} workflow (.json)` : 'Workflow export coming soon'}
            onClick={(e) => !phase.json && e.preventDefault()}
          >
            ↓ Download .json
          </a>
        </div>
      </div>
    </div>
  )
}

function OutputPanel({ pairs }) {
  const [i, setI] = useState(0)
  const pair = pairs[i]
  return (
    <div className="ct-panel ct-output">
      <div className="ct-panel-head">
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
      <div className="ct-result">
        <figure className="ct-result-frame">
          <span className="ct-chip">Before</span>
          <img src={pair.before} alt={`${pair.label}, before`} draggable="false" />
        </figure>
        <figure className="ct-result-frame ct-result-after">
          <span className="ct-chip ct-chip-after">After</span>
          <img src={pair.after} alt={`${pair.label}, after`} draggable="false" />
        </figure>
      </div>
    </div>
  )
}

export default function CatalogToolPage() {
  const [active, setActive] = useState(0)
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

      <div className="ct-grid">
        <InputsPanel phases={PHASES} active={active} onPick={setActive} />
        <WorkflowPanel phase={PHASES[active]} />
        <OutputPanel pairs={PAIRS} />
      </div>
    </main>
  )
}

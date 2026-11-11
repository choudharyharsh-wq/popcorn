import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import popLogoUrl from './assets/hero/pop.svg'
import './CatalogPage.css'

// Before / after pairs. Drop the files in public/catalog/pairs/ and list them here:
//   { label: 'Hoodie', before: '/catalog/pairs/hoodie-before.webp', after: '/catalog/pairs/hoodie-after.webp' }
// Optional: `layout: 'side'` shows both images next to each other (good for phone screens) instead of a
// drag slider; `ratio` (width / height of the images, default 4 / 5) and `maxWidth` (px, default 760).
const PAIRS = [
  {
    label: 'Footwear',
    before: '/catalog/pairs/sneakers-before.webp',
    after: '/catalog/pairs/sneakers-after.webp',
    layout: 'side',
    ratio: '584 / 1190',
  },
  {
    label: 'T-shirts',
    before: '/catalog/pairs/tshirts-before.webp',
    after: '/catalog/pairs/tshirts-after.webp',
    layout: 'side',
    ratio: '584 / 1190',
  },
]

// n8n workflows. `json` is the exported workflow file in public/catalog/ (the download button
// appears once it is set), `image` is the screenshot shown in the viewer.
const PHASES = [
  {
    key: 'edit',
    tab: 'Edit',
    title: 'Phase 1 · Editing',
    image: '/catalog/phase-1-editing.png',
    json: null,
    points: [
      'Reads every product row from a Google Sheet',
      'Skips anything that was already edited',
      'Sends the product photo and a studio background to Gemini',
      'Saves the result to cloud storage and writes the link back to the sheet',
    ],
  },
  {
    key: 'check',
    tab: 'Check',
    title: 'Phase 2 · Quality check',
    image: '/catalog/phase-2-qc.png',
    json: null,
    points: [
      'Picks up only freshly edited images',
      'Gemini 2.5 Flash compares the original and the edit side by side',
      'Marks PASS, or FAIL with a one-line reason such as “logo blurred” or “product edge warped”',
    ],
  },
  {
    key: 'fix',
    tab: 'Fix',
    title: 'Phase 3 · Re-editing',
    image: '/catalog/phase-3-reedit.png',
    json: null,
    points: [
      'Collects the failed images along with their failure reasons',
      'Gives the model the original, the background and the failed attempt',
      'Escalates to Gemini 3 Pro with the reason added to the prompt',
      'Keeps the old version and sends the new one back to be checked',
    ],
  },
]

const STATS = [
  { value: '3', label: 'automated pipelines: edit, check, fix' },
  { value: '500', label: 'images in a single run' },
  { value: '~15', label: 'images edited every minute' },
  { value: '0', label: 'images ever edited twice' },
]

const STEPS = [
  {
    n: '01',
    name: 'Edit',
    line: 'Every product is placed on a clean, consistent studio background.',
    bullets: ['Lighting and color matched across the catalogue', 'Background composited by Gemini', 'Result saved and logged in the sheet'],
  },
  {
    n: '02',
    name: 'Check',
    line: 'A second AI compares the original with the edit before anything goes live.',
    bullets: ['Logo and labels still intact?', 'Product shape undistorted?', 'Edges around the background clean?'],
  },
  {
    n: '03',
    name: 'Fix',
    line: 'Anything that fails goes back for a smarter second try.',
    bullets: ['Stronger model, Gemini 3 Pro', 'Sees the failed attempt and why it failed', 'Re-checked automatically'],
  },
]

const SAFEGUARDS = [
  { title: 'Never edits twice', text: 'Finished rows are skipped, so a crash or a re-run costs nothing extra.' },
  { title: 'Gentle on memory', text: 'One image at a time, and at most 500 per run, so the workflow never chokes.' },
  { title: 'Rate-limit friendly', text: 'Working through images one by one keeps it near 15 a minute, with no waiting steps.' },
  { title: 'Full audit trail', text: 'The previous version, its link and its failure reason are kept for every re-edit.' },
]

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function Section({ id, eyebrow, title, intro, children }) {
  const ref = useReveal()
  return (
    <section className="cat-section reveal" id={id} ref={ref}>
      <p className="cat-eyebrow">{eyebrow}</p>
      <h2 className="cat-h2">{title}</h2>
      {intro && <p className="cat-intro">{intro}</p>}
      {children}
    </section>
  )
}

function Compare({ pair }) {
  const [pos, setPos] = useState(50)
  return (
    <div
      className="cmp"
      style={{ '--pos': `${pos}%`, ...(pair.ratio && { aspectRatio: pair.ratio }), ...(pair.maxWidth && { maxWidth: pair.maxWidth }) }}
    >
      <img className="cmp-img" src={pair.after} alt={`${pair.label}, after`} draggable="false" />
      <img className="cmp-img cmp-before" src={pair.before} alt={`${pair.label}, before`} draggable="false" />
      <span className="cmp-chip cmp-chip-l">Before</span>
      <span className="cmp-chip cmp-chip-r">After</span>
      <span className="cmp-line" aria-hidden="true">
        <span className="cmp-knob">‹ ›</span>
      </span>
      <input
        className="cmp-range"
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare before and after: ${pair.label}`}
      />
    </div>
  )
}

function SideBySide({ pair }) {
  return (
    <div className="sbs" style={pair.ratio ? { '--ratio': pair.ratio } : undefined}>
      <figure className="sbs-frame">
        <span className="sbs-chip">Before</span>
        <img src={pair.before} alt={`${pair.label}, before`} draggable="false" />
      </figure>
      <span className="sbs-arrow" aria-hidden="true" />
      <figure className="sbs-frame sbs-after">
        <span className="sbs-chip">After</span>
        <img src={pair.after} alt={`${pair.label}, after`} draggable="false" />
      </figure>
    </div>
  )
}

function BeforeAfter() {
  const [i, setI] = useState(0)
  if (!PAIRS.length) {
    return (
      <div className="cmp-empty">
        <div className="cmp-empty-frame">Before</div>
        <div className="cmp-empty-frame">After</div>
        <p>Sample comparisons are on their way.</p>
      </div>
    )
  }
  return (
    <div className="cmp-wrap">
      {PAIRS[i].layout === 'side' ? <SideBySide key={PAIRS[i].after} pair={PAIRS[i]} /> : <Compare key={PAIRS[i].after} pair={PAIRS[i]} />}
      {PAIRS.length > 1 && (
        <div className="cmp-thumbs" role="tablist" aria-label="Choose a sample">
          {PAIRS.map((p, n) => (
            <button
              key={p.after}
              type="button"
              role="tab"
              aria-selected={n === i}
              className={`cmp-thumb${n === i ? ' is-on' : ''}`}
              onClick={() => setI(n)}
            >
              <img src={p.after} alt="" loading="lazy" draggable="false" style={p.layout === 'side' ? { objectFit: 'contain' } : undefined} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Workflows() {
  const [k, setK] = useState(0)
  const [zoom, setZoom] = useState(1)
  const p = PHASES[k]
  const pick = (n) => {
    setK(n)
    setZoom(1)
  }
  return (
    <div className="wf">
      <div className="wf-tabs" role="tablist" aria-label="Workflow phase">
        {PHASES.map((ph, n) => (
          <button
            key={ph.key}
            type="button"
            role="tab"
            aria-selected={n === k}
            className={`wf-tab${n === k ? ' is-on' : ''}`}
            onClick={() => pick(n)}
          >
            <span>{String(n + 1).padStart(2, '0')}</span>
            {ph.tab}
          </button>
        ))}
      </div>

      <div className="wf-window">
        <div className="wf-bar">
          <span className="wf-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="wf-name">n8n · {p.title}</span>
          <span className="wf-zoom">
            <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} aria-label="Zoom out" disabled={zoom <= 1}>
              −
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))} aria-label="Zoom in" disabled={zoom >= 3}>
              +
            </button>
          </span>
        </div>
        <div className="wf-canvas" tabIndex={0} aria-label={`${p.title} workflow, scrollable`}>
          <img
            key={p.image}
            src={p.image}
            alt={`n8n workflow for ${p.title}`}
            style={{ width: `${zoom * 100}%` }}
            draggable="false"
          />
        </div>
      </div>

      <div className="wf-foot">
        <ul className="wf-points">
          {p.points.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="wf-actions">
          {p.json && (
            <a className="cat-btn cat-btn-primary" href={p.json} download>
              Download workflow (.json)
            </a>
          )}
          <a className={`cat-btn${p.json ? '' : ' cat-btn-primary'}`} href={p.image} download>
            Download screenshot
          </a>
          <a className="cat-btn" href={p.image} target="_blank" rel="noopener noreferrer">
            Open full size
          </a>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const heroRef = useReveal()
  return (
    <main className="cat">
      <header className="cat-top">
        <Link to="/" className="cat-logo" aria-label="popcorn.design home">
          <img src={popLogoUrl} alt="" />
        </Link>
      </header>

      <section className="cat-hero reveal" ref={heroRef}>
        <p className="cat-eyebrow cat-eyebrow-serif">AI Cataloging Tool</p>
        <h1 className="cat-h1">
          A whole catalogue,
          <br />
          <em>cleaned automatically.</em>
        </h1>
        <p className="cat-lead">
          We took an entire catalogue of inconsistent vendor photos — electronics, food &amp; beverage, apparel, home decor,
          kids' toys, jewellery, and more — and turned it into one clean, store-ready set. AI edits every image, checks its
          own work, and fixes whatever misses the mark.
        </p>
        <div className="cat-cta">
          <a className="cat-btn cat-btn-primary" href="#difference">
            See the difference
          </a>
          <a className="cat-btn" href="#workflows">
            View the workflows
          </a>
        </div>
        <ul className="cat-stats">
          {STATS.map((s) => (
            <li key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <Section
        id="how"
        eyebrow="How it works"
        title="Edit. Check. Fix."
        intro="Three small automations hand the work to each other, so a person only looks at the exceptions."
      >
        <ol className="cat-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="cat-step">
              <span className="cat-step-n">{s.n}</span>
              <h3>{s.name}</h3>
              <p>{s.line}</p>
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="cat-flow" aria-label="Images that pass the check are production ready; failed ones loop back through Fix">
          <span className="cat-flow-pill">Edited</span>
          <span className="cat-flow-arrow" aria-hidden="true" />
          <span className="cat-flow-pill">Checked</span>
          <span className="cat-flow-arrow" aria-hidden="true" />
          <span className="cat-flow-pill cat-flow-ok">Production ready</span>
          <span className="cat-flow-loop">Failed? It goes through Fix and is checked again.</span>
        </div>
      </Section>

      <Section
        id="difference"
        eyebrow="Before and after"
        title="See the difference"
        intro="The vendor’s original photos on the left, the AI-edited result on the right."
      >
        <BeforeAfter />
      </Section>

      <Section
        id="workflows"
        eyebrow="Under the hood"
        title="The n8n workflows"
        intro="This is the real automation. Switch between the three phases, zoom in, and download what you need."
      >
        <Workflows />
      </Section>

      <Section id="safe" eyebrow="Built to be trusted" title="Safe to leave running">
        <ul className="cat-safe">
          {SAFEGUARDS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="cat-foot">
        <a
          className="cat-btn cat-btn-primary"
          href="https://harsh3101.substack.com/p/end-to-end-e-commerce-catalogue-image"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the full write-up
        </a>
        <Link className="cat-btn" to="/">
          Back to home
        </Link>
      </footer>
    </main>
  )
}

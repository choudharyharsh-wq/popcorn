// Runs after `vite build` and `vite build --ssr`: bakes the home page into dist/index.html
// so the hero and its image/font downloads start before any JavaScript has run.
// The untouched app shell is kept as dist/shell.html for the tool routes.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const { render } = await import(pathToFileURL(path.resolve('dist-server/entry-server.js')).href)

const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
fs.writeFileSync(path.join(dist, 'shell.html'), shell)

// Artwork file names carry a content hash (so a changed file always gets a new URL and can be
// cached forever); the build manifest tells us what each source file ended up being called.
const manifestPath = path.join(dist, '.vite', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const built = (src) => {
  const entry = manifest[src]
  return entry ? `/${entry.file}` : null // tiny files get inlined and have no separate URL
}

const images = [
  ['src/assets/hero/plate.webp', 'high'],
  ['src/assets/hero/design-fill.webp', 'high'],
  ['src/assets/hero/pop.svg', 'high'],
  ['src/assets/hero/strip-shape.svg', null],
  ['src/assets/hero/strip-glow.svg', null],
  ['src/assets/hero/strip-texture.webp', null],
]
const preloads = [
  ...images.flatMap(([src, priority]) => {
    const href = built(src)
    return href ? [`<link rel="preload" as="image" href="${href}"${priority ? ` fetchpriority="${priority}"` : ''} />`] : []
  }),
  '<link rel="preload" as="font" type="font/woff" href="/fonts/AwesomeSerifItalic-BdExraTall.woff" crossorigin />',
  '<link rel="preload" as="font" type="font/woff2" href="/fonts/DMSans-latin.woff2" crossorigin />',
].join('\n    ')

const marker = '<div id="root"></div>'
if (!shell.includes(marker)) throw new Error('root marker not found in dist/index.html')

const html = shell
  .replace(marker, `<div id="root" data-prerendered="1">${render('/')}</div>`)
  .replace('</head>', `    ${preloads}\n  </head>`)

fs.writeFileSync(path.join(dist, 'index.html'), html)
fs.rmSync(path.join(dist, '.vite'), { recursive: true, force: true }) // not needed in production
console.log(`prerendered / (${(html.length / 1024).toFixed(1)} KB html)`)

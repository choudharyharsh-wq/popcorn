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

const preloads = [
  '<link rel="preload" as="image" href="/hero/plate.webp" fetchpriority="high" />',
  '<link rel="preload" as="image" href="/hero/design-fill.webp" fetchpriority="high" />',
  '<link rel="preload" as="image" href="/hero/pop.svg" fetchpriority="high" />',
  '<link rel="preload" as="image" href="/hero/strip-shape.svg" />',
  '<link rel="preload" as="image" href="/hero/strip-glow.svg" />',
  '<link rel="preload" as="image" href="/hero/strip-texture.webp" />',
  '<link rel="preload" as="font" type="font/woff" href="/fonts/AwesomeSerifItalic-BdExraTall.woff" crossorigin />',
  '<link rel="preload" as="font" type="font/woff2" href="/fonts/DMSans-latin.woff2" crossorigin />',
].join('\n    ')

const marker = '<div id="root"></div>'
if (!shell.includes(marker)) throw new Error('root marker not found in dist/index.html')

const html = shell
  .replace(marker, `<div id="root" data-prerendered="1">${render('/')}</div>`)
  .replace('</head>', `    ${preloads}\n  </head>`)

fs.writeFileSync(path.join(dist, 'index.html'), html)
console.log(`prerendered / (${(html.length / 1024).toFixed(1)} KB html)`)

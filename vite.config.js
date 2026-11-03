import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // the manifest lets scripts/prerender.mjs find the fingerprinted file names for preloads
  build: {
    manifest: true,
    // the small hero pictures (the background gradient, the strip texture) go straight into the CSS,
    // so they paint with it instead of arriving as separate requests
    assetsInlineLimit: (file, content) => (file.includes('/assets/hero/') && content.length < 12000 ? true : undefined),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})

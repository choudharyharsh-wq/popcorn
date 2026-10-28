import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // the manifest lets scripts/prerender.mjs find the fingerprinted file names for preloads
  build: { manifest: true },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})

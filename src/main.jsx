import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// The home page is prerendered at build time; adopt that markup instead of redrawing it.
if (root.dataset.prerendered && window.location.pathname === '/') hydrateRoot(root, app)
else createRoot(root).render(app)

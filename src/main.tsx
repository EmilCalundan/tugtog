import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SharedSetlist } from './components/SharedSetlist.tsx'

// Kung may ?setlist=... sa link, ipakita ang shared setlist sa halip na ang buong app
const shareId = new URLSearchParams(window.location.search).get('setlist')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shareId ? <SharedSetlist shareId={shareId} /> : <App />}
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SongsPage } from './pages/SongsPage.tsx'
import { SongPage } from './pages/SongPage.tsx'
import { EditorPage } from './pages/EditorPage.tsx'
import { SetlistsPage } from './pages/SetlistsPage.tsx'
import { SetlistPage } from './pages/SetlistPage.tsx'
import { AccountPage } from './pages/AccountPage.tsx'
import { LearnPage } from './pages/LearnPage.tsx'
import { SharedSetlistPage } from './pages/SharedSetlistPage.tsx'

// Para gumana pa rin ang mga lumang share link na ?setlist=...
const oldShareId = new URLSearchParams(window.location.search).get('setlist')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/s/:shareId" element={<SharedSetlistPage />} />
        <Route element={<App />}>
          <Route index element={oldShareId ? <Navigate to={`/s/${oldShareId}`} replace /> : <SongsPage />} />
          <Route path="subukan" element={<SongPage scratch />} />
          <Route path="kanta/bago" element={<EditorPage />} />
          <Route path="kanta/:id" element={<SongPage />} />
          <Route path="kanta/:id/edit" element={<EditorPage />} />
          <Route path="setlist" element={<SetlistsPage />} />
          <Route path="setlist/:id" element={<SetlistPage />} />
          <Route path="matuto" element={<LearnPage />} />
          <Route path="ako" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

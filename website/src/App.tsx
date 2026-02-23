import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const LandingPage = lazy(() => import('./components/landing/LandingPage'))
const WorkspacePage = lazy(() => import('./components/workspace/WorkspacePage'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-[var(--text-muted)] text-sm">Loading...</div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/projects/:slug" element={<WorkspacePage />} />
      </Routes>
    </Suspense>
  )
}

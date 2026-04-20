import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageSkeleton from './components/PageSkeleton'
import Analytics from './components/Analytics'
import AppErrorBoundary from './components/AppErrorBoundary'

// Home and Journey are lightweight — load eagerly
import Home from './pages/Home'
import Journey from './pages/Journey'

// Map pages pull in Leaflet (~150 KB) — code-split so the home page loads fast
const MapRoute = lazy(() => import('./pages/MapRoute'))
const MapSites = lazy(() => import('./pages/MapSites'))

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Analytics />
        <main className="flex-1 pt-16">
          <AppErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/journey" element={<Journey />} />
                <Route path="/map-route" element={<MapRoute />} />
                <Route path="/map-sites" element={<MapSites />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

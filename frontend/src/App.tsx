import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageSkeleton from './components/PageSkeleton'
import Analytics from './components/Analytics'
import AppErrorBoundary from './components/AppErrorBoundary'

// Home, Journey, and NotFound are lightweight — load eagerly
import Home from './pages/Home'
import Journey from './pages/Journey'
import NotFound from './pages/NotFound'
import NotAvailable from './pages/NotAvailable'
import TokenPage from './pages/TokenPage'
import { ADMIN_PATH, LINK_ONLY } from './config'

// Map pages pull in Leaflet (~150 KB) — code-split so the home page loads fast
const MapRoute = lazy(() => import('./pages/MapRoute'))
const MapSites = lazy(() => import('./pages/MapSites'))
// Articles pull in the Markdown renderer — also loaded on demand
const Articles = lazy(() => import('./pages/Articles'))
const ArticleRoute = lazy(() => import('./pages/ArticlePage').then((m) => ({ default: m.ArticleRoute })))
// The admin tool is only ever downloaded by whoever opens its address
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Only exists when VITE_ADMIN_PATH is set; checked before the catch-all, in both modes.
            It has its own header, so it sits outside the site layout (no navbar, no analytics). */}
        {ADMIN_PATH && (
          <Route
            path={`/${ADMIN_PATH}`}
            element={
              <AppErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <AdminApp />
                </Suspense>
              </AppErrorBoundary>
            }
          />
        )}
        <Route path="*" element={<SiteLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

function SiteLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Analytics />
      <main className="flex-1 pt-16">
        <AppErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            {LINK_ONLY ? (
              // Pre-launch: pages open only through secret /p/:token links.
              <Routes>
                <Route path="/p/:token" element={<TokenPage />} />
                <Route path="*" element={<NotAvailable />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/journey" element={<Journey />} />
                <Route path="/map-route" element={<MapRoute />} />
                <Route path="/map-sites" element={<MapSites />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:id" element={<ArticleRoute />} />
                {/* Old secret links forward to the readable URLs */}
                <Route path="/p/:token" element={<TokenPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
          </Suspense>
        </AppErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

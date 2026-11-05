import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LINK_ONLY } from '../config'

/**
 * Render-less component that records a page view on every route change.
 * Place once inside BrowserRouter in App.tsx.
 *
 * Session ID: a UUID stored in sessionStorage so it resets when the tab
 * closes. This gives us unique-visitor counts without tracking users
 * across sessions or storing any personal data.
 *
 * Secret links (/p/:token) are never recorded by path, since the path is the
 * secret. TokenPage calls trackView with the page key instead. In link-only
 * mode every other address is recorded as "unavailable".
 *
 * Fire-and-forget: if the analytics call fails it is silently swallowed
 * so it never affects the user experience.
 */
export default function Analytics() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/p/')) return
    trackView(LINK_ONLY ? 'unavailable' : analyticsPage(pathname))
  }, [pathname])

  return null
}

/** Article pages are recorded by id ("article:7"), everything else by path. */
function analyticsPage(pathname: string): string {
  const article = /^\/articles\/(\d+)$/.exec(pathname)
  return article ? `article:${article[1]}` : pathname
}

/** Records one page view. `page` must never contain a secret token. */
export function trackView(page: string) {
  const sid = getSessionId()
  // sendBeacon is guaranteed to complete even if the user navigates away
  // mid-flight — unlike fetch, which can be cancelled on page unload.
  navigator.sendBeacon(
    '/api/analytics/view',
    new Blob(
      [JSON.stringify({ page, sessionId: sid })],
      { type: 'application/json' },
    ),
  )
}

function getSessionId(): string {
  let id = sessionStorage.getItem('sid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('sid', id)
  }
  return id
}

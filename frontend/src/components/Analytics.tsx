import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Render-less component that records a page view on every route change.
 * Place once inside BrowserRouter in App.tsx.
 *
 * Session ID: a UUID stored in sessionStorage so it resets when the tab
 * closes. This gives us unique-visitor counts without tracking users
 * across sessions or storing any personal data.
 *
 * Fire-and-forget: if the analytics call fails it is silently swallowed
 * so it never affects the user experience.
 */
export default function Analytics() {
  const { pathname } = useLocation()

  useEffect(() => {
    const sid = getSessionId()
    // sendBeacon is guaranteed to complete even if the user navigates away
    // mid-flight — unlike fetch, which can be cancelled on page unload.
    navigator.sendBeacon(
      '/api/analytics/view',
      new Blob(
        [JSON.stringify({ page: pathname, sessionId: sid })],
        { type: 'application/json' },
      ),
    )
  }, [pathname])

  return null
}

function getSessionId(): string {
  let id = sessionStorage.getItem('sid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('sid', id)
  }
  return id
}

import { useState, useEffect, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

/**
 * Fetches data from an async function and manages loading / error / retry state.
 *
 * @param fn            - Async function to call. Should be stable (defined outside
 *                        the component or wrapped in useCallback) to avoid re-fetching
 *                        on every render. The module-level api/client functions satisfy
 *                        this automatically.
 * @param errorMessage  - User-facing string shown when `fn` rejects. Keeps the hook
 *                        generic — callers decide what the error means to the user.
 *
 * Retry pattern: a `tick` counter in state is incremented by `retry()`. The
 * useEffect depends on `tick`, so incrementing it triggers a fresh fetch without
 * needing to re-pass `fn`. The effect also sets a `cancelled` flag on cleanup so
 * state is never updated after the component unmounts or the effect re-runs.
 */
export function useApi<T>(fn: () => Promise<T>, errorMessage: string): ApiState<T> {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then(result => { if (!cancelled) setData(result) })
      .catch(() => { if (!cancelled) setError(errorMessage) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => setTick(t => t + 1), [])

  return { data, loading, error, retry }
}

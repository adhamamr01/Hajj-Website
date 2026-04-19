import { useState, useEffect, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

/**
 * Fetches data from an async function and exposes loading / error / retry state.
 * Re-runs whenever `fn` identity changes (wrap in useCallback if needed).
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

/**
 * Asserts that `data` is an array and returns it typed as T[].
 * Throws a descriptive error if the backend returns something unexpected
 * (e.g. an HTML error page when the API URL is misconfigured).
 */
export function requireArray<T>(data: unknown, endpoint: string): T[] {
  if (Array.isArray(data)) return data as T[]
  throw new Error(
    `Expected an array from ${endpoint} but got: ${typeof data}. ` +
    `Check that VITE_API_BASE_URL is set correctly and the backend is running.`
  )
}

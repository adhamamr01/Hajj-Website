import axios from 'axios'
import type { MeeqatPoint, JourneyStep, HaramBoundary, BoundaryPoint } from '../types'
import { requireArray } from '../utils/array'

// In production the Netlify proxy forwards /api/* → Render backend,
// so a relative baseURL works in all environments.
// VITE_API_BASE_URL can still override for local dev against a remote backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

// Module-level promise cache. Stores each request's promise on first call so
// navigating back to a page resolves instantly without hitting the network again.
// On failure the entry is evicted so the retry button triggers a real re-fetch.
const cache = new Map<string, Promise<unknown>>()

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const p = fetcher().catch((err: unknown) => {
      cache.delete(key)
      return Promise.reject(err)
    })
    cache.set(key, p)
  }
  return cache.get(key) as Promise<T>
}

/** Clears the in-memory cache. Exposed for use in tests only. */
export const clearCache = () => cache.clear()

export const getMeeqatPoints = (): Promise<MeeqatPoint[]> =>
  cached('meeqat', () => api.get('/meeqat').then((r) => requireArray<MeeqatPoint>(r.data, '/meeqat')))

export const getJourneySteps = (): Promise<JourneyStep[]> =>
  cached('journey', () => api.get('/journey').then((r) => requireArray<JourneyStep>(r.data, '/journey')))

export const getHaramBoundaries = (): Promise<HaramBoundary[]> =>
  cached('boundary', () => api.get('/boundary').then((r) => requireArray<HaramBoundary>(r.data, '/boundary')))

export const getBoundaryPoints = (): Promise<BoundaryPoint[]> =>
  cached('boundary/points', () => api.get('/boundary/points').then((r) => requireArray<BoundaryPoint>(r.data, '/boundary/points')))

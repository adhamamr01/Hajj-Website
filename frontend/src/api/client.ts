import axios from 'axios'
import type { MeeqatPoint, JourneyStep, HaramBoundary, BoundaryPoint, LinkTarget, Article, ArticleSummary } from '../types'
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

// Link-only mode: the secret token of the page being viewed, sent with content
// requests so the backend can verify access. Set by TokenPage once the link resolves.
let pageToken: string | null = null

export const setPageToken = (token: string | null) => { pageToken = token }

const tokenHeaders = () => (pageToken ? { 'X-Page-Token': pageToken } : undefined)

function cached<T>(name: string, fetcher: () => Promise<T>): Promise<T> {
  // Keyed by token as well, so data fetched under one token is never served for another.
  const key = `${pageToken ?? ''}|${name}`
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
  cached('meeqat', () => api.get('/meeqat', { headers: tokenHeaders() }).then((r) => requireArray<MeeqatPoint>(r.data, '/meeqat')))

export const getJourneySteps = (): Promise<JourneyStep[]> =>
  cached('journey', () => api.get('/journey', { headers: tokenHeaders() }).then((r) => requireArray<JourneyStep>(r.data, '/journey')))

export const getHaramBoundaries = (): Promise<HaramBoundary[]> =>
  cached('boundary', () => api.get('/boundary', { headers: tokenHeaders() }).then((r) => requireArray<HaramBoundary>(r.data, '/boundary')))

export const getBoundaryPoints = (): Promise<BoundaryPoint[]> =>
  cached('boundary/points', () => api.get('/boundary/points', { headers: tokenHeaders() }).then((r) => requireArray<BoundaryPoint>(r.data, '/boundary/points')))

/**
 * Asks the backend what a secret link opens. Resolves to null when the token is
 * unknown or revoked (404); any other failure rejects so the caller can offer a retry.
 * Deliberately not cached: a "not found" must never be remembered as an answer.
 */
export const resolveLink = (token: string): Promise<LinkTarget | null> =>
  api.get<LinkTarget>(`/links/${encodeURIComponent(token)}`)
    .then((r) => r.data)
    .catch((err: { response?: { status?: number } }) => {
      if (err?.response?.status === 404) return null
      return Promise.reject(err)
    })

/** Published articles for the normal (non link-only) site. Not cached: new articles show up on reload. */
export const getArticles = (): Promise<ArticleSummary[]> =>
  api.get('/articles').then((r) => requireArray<ArticleSummary>(r.data, '/articles'))

/**
 * One published article, or null when it does not exist, is a draft, or the token
 * does not open it (404). Other failures reject so the caller can offer a retry.
 * Not cached, so an edit shows up on the next visit and a 404 is never remembered.
 */
export const getArticle = (id: string): Promise<Article | null> =>
  api.get<Article>(`/articles/${encodeURIComponent(id)}`, { headers: tokenHeaders() })
    .then((r) => r.data)
    .catch((err: { response?: { status?: number } }) => {
      if (err?.response?.status === 404) return null
      return Promise.reject(err)
    })

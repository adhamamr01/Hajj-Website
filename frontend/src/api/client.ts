import axios from 'axios'
import type { MeeqatPoint, JourneyStep, HaramBoundary, BoundaryPoint } from '../types'
import { requireArray } from '../utils/array'

// In production the Netlify proxy forwards /api/* → Render backend,
// so a relative baseURL works in all environments.
// VITE_API_BASE_URL can still override for local dev against a remote backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

export const getMeeqatPoints = (): Promise<MeeqatPoint[]> =>
  api.get('/meeqat').then((r) => requireArray<MeeqatPoint>(r.data, '/meeqat'))

export const getJourneySteps = (): Promise<JourneyStep[]> =>
  api.get('/journey').then((r) => requireArray<JourneyStep>(r.data, '/journey'))

export const getHaramBoundaries = (): Promise<HaramBoundary[]> =>
  api.get('/boundary').then((r) => requireArray<HaramBoundary>(r.data, '/boundary'))

export const getBoundaryPoints = (): Promise<BoundaryPoint[]> =>
  api.get('/boundary/points').then((r) => requireArray<BoundaryPoint>(r.data, '/boundary/points'))

import axios from 'axios'
import type { MeeqatPoint, JourneyStep, HaramBoundary, BoundaryPoint } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

export const getMeeqatPoints = (): Promise<MeeqatPoint[]> =>
  api.get<MeeqatPoint[]>('/meeqat').then((r) => r.data)

export const getJourneySteps = (): Promise<JourneyStep[]> =>
  api.get<JourneyStep[]>('/journey').then((r) => r.data)

export const getHaramBoundaries = (): Promise<HaramBoundary[]> =>
  api.get<HaramBoundary[]>('/boundary').then((r) => r.data)

export const getBoundaryPoints = (): Promise<BoundaryPoint[]> =>
  api.get<BoundaryPoint[]>('/boundary/points').then((r) => r.data)

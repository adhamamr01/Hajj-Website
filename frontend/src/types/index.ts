// Fields marked optional (?) can legitimately be null/empty in the DB.
// Required fields map to NOT NULL columns and the backend always returns them.

export interface MeeqatPoint {
  id: string
  name: string
  lat: number
  lng: number
  direction?: string
  forPilgrims?: string
  distance?: string
  color?: string
  modern?: string
  description?: string
  images?: string[]
  videoUrl?: string
}

export interface JourneyStep {
  id: number
  stepNumber: number
  title: string
  description?: string
  borderColor?: string
  titleColor?: string
}

export interface HaramBoundary {
  id: number
  name: string
  description?: string
  centerLat: number
  centerLng: number
  radius: number
  color?: string
}

export interface BoundaryPoint {
  id: number
  name?: string
  lat: number
  lng: number
  orderIndex: number
}

import { useState, useEffect, useMemo, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation } from 'lucide-react'
import { getMeeqatPoints } from '../api/client'
import type { MeeqatPoint } from '../types'

const MAKKAH: [number, number] = [21.4225, 39.8262]
const R_EARTH = 6371 // km

// ── Geographic math ──────────────────────────────────────────────────────

function toRad(d: number) { return (d * Math.PI) / 180 }
function toDeg(r: number) { return (r * 180) / Math.PI }

/** Clockwise bearing (0–360°) from point A to point B */
function bearingTo(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[0]), lat2 = toRad(b[0])
  const dLng = toRad(b[1] - a[1])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Haversine distance in km */
function distKm(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.sqrt(h))
}

/** Point at a given bearing and distance from an origin */
function destPoint(
  origin: [number, number],
  bearingDeg: number,
  km: number,
): [number, number] {
  const lat1 = toRad(origin[0])
  const lng1 = toRad(origin[1])
  const b = toRad(bearingDeg)
  const d = km / R_EARTH
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    )
  return [toDeg(lat2), toDeg(lng2)]
}

/** Clockwise midpoint angle between two bearings */
function midBearing(a: number, b: number): number {
  let end = b
  while (end < a) end += 360
  return ((a + end) / 2) % 360
}

/** Dense array of lat/lng points along a clockwise arc */
function arcPoints(
  center: [number, number],
  radiusKm: number,
  startBearing: number,
  endBearing: number,
  steps = 80,
): [number, number][] {
  let end = endBearing
  while (end <= startBearing) end += 360
  return Array.from({ length: steps + 1 }, (_, i) => {
    const b = startBearing + ((end - startBearing) * i) / steps
    return destPoint(center, b, radiusKm)
  })
}

// ── Marker helpers ───────────────────────────────────────────────────────

/** Two-letter abbreviation from a Meeqat name, e.g. "Dhul-Hulayfah" → "DH" */
function abbr(name: string): string {
  const words = name
    .split('(')[0]
    .trim()
    .split(/[\s-]+/)
    .map(w => w.replace(/^[^a-zA-Z]+/, ''))
    .filter(Boolean)
  const caps = words
    .filter(w => w.length > 0 && w[0] === w[0].toUpperCase())
    .map(w => w[0].toUpperCase())
  if (caps.length >= 2) return caps.slice(0, 2).join('')
  if (words.length > 0) return words[0].substring(0, 2).toUpperCase()
  return '?'
}

const createIcon = (color: string, label: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35)"><span style="color:white;font-size:13px;font-weight:700;letter-spacing:0.5px">${label}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })

const kaabaIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:linear-gradient(135deg,#1a5f3f,#2a7f5f);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4)"><span style="font-size:26px">🕋</span></div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
})

// ── Image sub-component ──────────────────────────────────────────────────

function MeeqatImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-20 w-28 object-cover rounded flex-shrink-0"
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function MeeqatMap() {
  const [showLines, setShowLines] = useState(true)
  const [showArcs, setShowArcs]   = useState(true)
  const [points, setPoints]       = useState<MeeqatPoint[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    getMeeqatPoints()
      .then(setPoints)
      .catch(() => setError('Failed to load Meeqat data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const handleGetDirections = (lat: number, lng: number) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          window.open(
            `https://www.google.com/maps/dir/${coords.latitude},${coords.longitude}/${lat},${lng}`,
            '_blank',
          )
        },
        () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank'),
      )
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }
  }

  /**
   * For each Meeqat, compute an arc:
   * - Centered on Makkah at the point's real distance
   * - Spanning from the angular midpoint with the previous neighbour
   *   to the angular midpoint with the next neighbour (clockwise order)
   */
  const arcs = useMemo(() => {
    if (points.length < 2) return []

    const enriched = points
      .map(p => ({
        ...p,
        bearing: bearingTo(MAKKAH, [p.lat, p.lng]),
        radius:  distKm(MAKKAH, [p.lat, p.lng]),
      }))
      .sort((a, b) => a.bearing - b.bearing)

    const n = enriched.length
    return enriched.map((p, i) => {
      const prev = enriched[(i - 1 + n) % n]
      const next = enriched[(i + 1) % n]
      const start = midBearing(prev.bearing, p.bearing)
      const end   = midBearing(p.bearing, next.bearing)
      return {
        id:     p.id,
        color:  p.color ?? '#888',
        points: arcPoints(MAKKAH, p.radius, start, end),
      }
    })
  }, [points])

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-200 rounded-xl flex items-center justify-center">
        <p className="text-gray-600">Loading map…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="h-[600px] bg-red-50 rounded-xl flex items-center justify-center border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <button
          onClick={() => setShowLines(!showLines)}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${showLines ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {showLines ? 'Hide Routes' : 'Show Routes'}
        </button>
        <button
          onClick={() => setShowArcs(!showArcs)}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${showArcs ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {showArcs ? 'Hide Arcs' : 'Show Arcs'}
        </button>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden shadow-2xl">
        <MapContainer center={[22.5, 40.0]} zoom={6} style={{ height: '600px', width: '100%' }} className="z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Makkah */}
          <Marker position={MAKKAH} icon={kaabaIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg text-primary mb-2">🕋 Makkah al-Mukarramah</h3>
                <p className="text-sm">The Holy City and destination of all Hajj pilgrims.</p>
              </div>
            </Popup>
          </Marker>

          {/* Arcs */}
          {showArcs && arcs.map(arc => (
            <Polyline
              key={`arc-${arc.id}`}
              positions={arc.points}
              pathOptions={{
                color:     arc.color,
                weight:    3,
                opacity:   0.85,
                dashArray: '6 4',
              }}
            />
          ))}

          {/* Meeqat markers + route lines */}
          {points.map(point => (
            <Fragment key={point.id}>
              <Marker
                position={[point.lat, point.lng]}
                icon={createIcon(point.color ?? '#888', abbr(point.name))}
              >
                <Popup maxWidth={300}>
                  <div className="p-3 w-64">
                    {/* Header */}
                    <h3 className="font-bold text-base mb-1" style={{ color: point.color ?? '#333' }}>
                      {point.name}
                    </h3>

                    {/* Key facts */}
                    <p className="text-xs text-gray-500 mb-1">
                      {point.direction ?? '—'} · {point.distance ?? '—'} from Makkah
                    </p>
                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                      <strong>For:</strong> {point.forPilgrims ?? 'General pilgrims'}
                    </p>

                    {/* Images */}
                    {(point.images?.length ?? 0) > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                        {point.images!.map((src, i) => (
                          <MeeqatImage key={i} src={src} alt={`${point.name} ${i + 1}`} />
                        ))}
                      </div>
                    )}

                    {/* Single navigate button */}
                    <button
                      onClick={() => handleGetDirections(point.lat, point.lng)}
                      className="w-full py-2 px-3 rounded text-sm font-semibold text-white flex items-center justify-center gap-1"
                      style={{ backgroundColor: point.color ?? '#888' }}
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>
                  </div>
                </Popup>
              </Marker>

              {showLines && (
                <Polyline
                  positions={[[point.lat, point.lng], MAKKAH]}
                  pathOptions={{ color: point.color ?? '#888', weight: 2.5, opacity: 0.6, dashArray: '10 8' }}
                />
              )}
            </Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">Meeqat Points Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {points.map(point => (
            <div key={point.id} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow flex items-center justify-center"
                style={{ backgroundColor: point.color ?? '#888' }}
              >
                <span className="text-white text-xs font-bold">{abbr(point.name)}</span>
              </div>
              <span className="text-sm">{point.name.split(' (')[0]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕋</span>
            <span className="text-sm">Makkah</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          💡 Click any marker for photos, details &amp; directions
        </p>
      </div>
    </div>
  )
}

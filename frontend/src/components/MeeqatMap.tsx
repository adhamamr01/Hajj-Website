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

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
        color:  p.color,
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                icon={createIcon(point.color, abbr(point.name))}
              >
                <Popup maxWidth={420}>
                  <div className="p-4 w-96">
                    {/* Header */}
                    <h3 className="font-bold text-xl mb-1" style={{ color: point.color }}>
                      {point.name}
                    </h3>
                    {point.description && (
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {point.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4 text-sm border-t pt-3">
                      <p><strong>Direction:</strong> {point.direction}</p>
                      <p><strong>Distance:</strong> {point.distance}</p>
                      <p className="col-span-2"><strong>For:</strong> {point.forPilgrims}</p>
                      <p className="col-span-2"><strong>Modern name:</strong> {point.modern}</p>
                    </div>

                    {/* Images */}
                    {point.images.length > 0 && (
                      <div className="mb-4 border-t pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Photos
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {point.images.map((src, i) => (
                            <MeeqatImage key={i} src={src} alt={`${point.name} ${i + 1}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Place images in <code>frontend/public/images/</code>
                        </p>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="bg-blue-500 text-white py-2 px-3 rounded text-center text-sm hover:bg-blue-600 transition-colors"
                      >
                        🗺️ Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`}
                        target="_blank" rel="noopener noreferrer"
                        className="bg-cyan-500 text-white py-2 px-3 rounded text-center text-sm hover:bg-cyan-600 transition-colors"
                      >
                        🚗 Waze
                      </a>
                    </div>
                    <button
                      onClick={() => handleGetDirections(point.lat, point.lng)}
                      className="w-full py-2 px-3 rounded text-sm font-semibold text-white"
                      style={{ backgroundColor: point.color }}
                    >
                      <Navigation className="inline w-4 h-4 mr-1" />
                      Get Directions from My Location
                    </button>
                  </div>
                </Popup>
              </Marker>

              {showLines && (
                <Polyline
                  positions={[[point.lat, point.lng], MAKKAH]}
                  pathOptions={{ color: point.color, weight: 2.5, opacity: 0.6, dashArray: '10 8' }}
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
                style={{ backgroundColor: point.color }}
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

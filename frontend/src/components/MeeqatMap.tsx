import { useState, useMemo, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation } from 'lucide-react'
import { getMeeqatPoints } from '../api/client'
import { useApi } from '../hooks/useApi'
import { bearingTo, distKm, midBearing, arcPoints } from '../utils/geo'

const MAKKAH: [number, number] = [21.4225, 39.8262]

// ── Marker helpers ───────────────────────────────────────────────────────

function abbr(name: string): string {
  const words = name
    .split('(')[0].trim()
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

  const { data: points, loading, error, retry } = useApi(
    getMeeqatPoints,
    'Failed to load Meeqat data. Is the backend running?',
  )

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

  const arcs = useMemo(() => {
    if (!points || points.length < 2) return []
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
      return { id: p.id, color: p.color ?? '#888', points: arcPoints(MAKKAH, p.radius, start, end) }
    })
  }, [points])

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Control button shimmer */}
        <div className="flex gap-3 justify-center animate-pulse">
          <div className="h-11 w-32 bg-gray-200 rounded-lg" />
          <div className="h-11 w-28 bg-gray-200 rounded-lg" />
        </div>
        {/* Map shimmer — viewport-capped height */}
        <div className="rounded-xl bg-gray-200 animate-pulse" style={{ height: 'min(600px, 65vh)' }}>
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-sm">Loading map…</p>
          </div>
        </div>
        <div className="h-36 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-4 p-8"
        style={{ minHeight: 'min(300px, 50vh)' }}
      >
        <p className="text-red-700 font-medium text-center">{error}</p>
        <button onClick={retry} className="btn-primary text-sm py-2 px-5">
          Retry
        </button>
      </div>
    )
  }

  const safePoints = points ?? []

  return (
    <div>
      {/* Controls — full-width on mobile, centred on larger screens */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <button
          onClick={() => setShowLines(!showLines)}
          className={`flex-1 sm:flex-none min-h-[44px] px-5 py-3 rounded-lg font-medium transition-all text-sm ${
            showLines ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showLines ? 'Hide Routes' : 'Show Routes'}
        </button>
        <button
          onClick={() => setShowArcs(!showArcs)}
          className={`flex-1 sm:flex-none min-h-[44px] px-5 py-3 rounded-lg font-medium transition-all text-sm ${
            showArcs ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showArcs ? 'Hide Arcs' : 'Show Arcs'}
        </button>
      </div>

      {/* Map — viewport-capped height so it never exceeds the screen */}
      <div className="rounded-xl overflow-hidden shadow-2xl">
        <MapContainer
          center={[22.5, 40.0]}
          zoom={6}
          style={{ height: 'min(600px, 65vh)', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <Marker position={MAKKAH} icon={kaabaIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg text-primary mb-2">🕋 Makkah al-Mukarramah</h3>
                <p className="text-sm">The Holy City and destination of all Hajj pilgrims.</p>
              </div>
            </Popup>
          </Marker>

          {showArcs && arcs.map(arc => (
            <Polyline
              key={`arc-${arc.id}`}
              positions={arc.points}
              pathOptions={{ color: arc.color, weight: 3, opacity: 0.85, dashArray: '6 4' }}
            />
          ))}

          {safePoints.map(point => (
            <Fragment key={point.id}>
              <Marker
                position={[point.lat, point.lng]}
                icon={createIcon(point.color ?? '#888', abbr(point.name))}
              >
                {/* Popup width capped so it fits on narrow phones */}
                <Popup maxWidth={Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 48 : 280)}>
                  <div className="p-3" style={{ width: 'min(256px, calc(100vw - 64px))' }}>
                    <h3 className="font-bold text-base mb-1" style={{ color: point.color ?? '#333' }}>
                      {point.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      {point.direction ?? '—'} · {point.distance ?? '—'} from Makkah
                    </p>
                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                      <strong>For:</strong> {point.forPilgrims ?? 'General pilgrims'}
                    </p>

                    {(point.images?.length ?? 0) > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                        {point.images!.map((src, i) => (
                          <MeeqatImage key={i} src={src} alt={`${point.name} ${i + 1}`} />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleGetDirections(point.lat, point.lng)}
                      className="w-full min-h-[44px] py-2 px-3 rounded text-sm font-semibold text-white flex items-center justify-center gap-2"
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
      <div className="mt-6 bg-white p-5 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">Meeqat Points Legend</h3>
        {/* Scrollable on mobile, grid on larger screens */}
        <div className="flex flex-wrap gap-3 md:grid md:grid-cols-3 lg:grid-cols-6">
          {safePoints.map(point => (
            <div key={point.id} className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 flex-shrink-0 rounded-full border-2 border-white shadow flex items-center justify-center"
                style={{ backgroundColor: point.color ?? '#888' }}
              >
                <span className="text-white text-xs font-bold">{abbr(point.name)}</span>
              </div>
              <span className="text-sm truncate">{point.name.split(' (')[0]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-2xl flex-shrink-0">🕋</span>
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

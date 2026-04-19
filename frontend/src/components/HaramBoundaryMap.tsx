import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getBoundaryPoints } from '../api/client'
import { useApi } from '../hooks/useApi'

const MAKKAH_COORDS: [number, number] = [21.4225, 39.8262]

const boundaryPointIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

const kaabaIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:linear-gradient(135deg,#1a5f3f,#2a7f5f);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4)"><span style="font-size:26px">🕋</span></div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
})

export default function HaramBoundaryMap() {
  const { data: points, loading, error, retry } = useApi(
    getBoundaryPoints,
    'Failed to load boundary data. Is the backend running?',
  )

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="rounded-xl bg-gray-200 animate-pulse flex items-center justify-center"
        style={{ height: 'min(500px, 60vh)' }}
      >
        <p className="text-gray-500 text-sm">Loading map…</p>
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
  const polygon: [number, number][] = safePoints.map(p => [p.lat, p.lng])

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl">
      <MapContainer
        center={MAKKAH_COORDS}
        zoom={10}
        style={{ height: 'min(500px, 60vh)', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={MAKKAH_COORDS} icon={kaabaIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg text-primary mb-1">🕋 Masjid al-Haram</h3>
              <p className="text-sm">Approximate center point of the Haram sanctuary in Makkah.</p>
            </div>
          </Popup>
        </Marker>

        {safePoints.map(point => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={boundaryPointIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">{point.name || 'Boundary Point'}</h3>
              </div>
            </Popup>
          </Marker>
        ))}

        {polygon.length > 0 && (
          <Polygon
            positions={polygon}
            pathOptions={{ color: '#16a34a', weight: 4, opacity: 1, fillColor: '#22c55e', fillOpacity: 0.25 }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg text-primary mb-1">Approximate Haram Boundary</h3>
                <p className="text-sm text-gray-700">
                  This polygon is an educational approximation of the sanctuary boundary based on
                  well-known points like at-Tan&apos;im, Al-Ji&apos;ranah, Idhat Liban, and Hudaybiyyah.
                </p>
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>
    </div>
  )
}

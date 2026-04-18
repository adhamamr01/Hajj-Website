import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getBoundaryPoints } from '../api/client'
import type { BoundaryPoint } from '../types'

const MAKKAH_COORDS: [number, number] = [21.4225, 39.8262]

// Small green dot for boundary polygon vertices — no CDN dependency
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
  const [points, setPoints] = useState<BoundaryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBoundaryPoints()
      .then(setPoints)
      .catch(() => setError('Failed to load boundary data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="h-[500px] bg-gray-200 rounded-xl flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[500px] bg-red-50 rounded-xl flex items-center justify-center border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const polygon: [number, number][] = points.map((p) => [p.lat, p.lng])

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl">
      <MapContainer center={MAKKAH_COORDS} zoom={10} style={{ height: '500px', width: '100%' }} className="z-0">
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

        {points.map((point) => (
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
            pathOptions={{ color: '#22c55e', weight: 3, opacity: 0.9, fillColor: '#22c55e', fillOpacity: 0.15 }}
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

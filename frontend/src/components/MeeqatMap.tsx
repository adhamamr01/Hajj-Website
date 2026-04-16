import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation } from 'lucide-react'
import { getMeeqatPoints } from '../api/client'
import type { MeeqatPoint } from '../types'

const MAKKAH_COORDS: [number, number] = [21.4225, 39.8262]

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const createIcon = (color: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3)"><span style="color:white;font-size:18px;font-weight:bold">M</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })

const kaabaIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:linear-gradient(135deg,#1a5f3f,#2a7f5f);width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4)"><span style="font-size:26px">🕋</span></div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
})

export default function MeeqatMap() {
  const [showLines, setShowLines] = useState(true)
  const [points, setPoints] = useState<MeeqatPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          window.open(`https://www.google.com/maps/dir/${coords.latitude},${coords.longitude}/${lat},${lng}`, '_blank')
        },
        () => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
        }
      )
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-200 rounded-xl flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
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
      <div className="flex gap-4 mb-6 justify-center">
        <button
          onClick={() => setShowLines(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${showLines ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Show All Routes
        </button>
        <button
          onClick={() => setShowLines(false)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${!showLines ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Hide Routes
        </button>
      </div>

      <div className="rounded-xl overflow-hidden shadow-2xl">
        <MapContainer center={[22.5, 40.0]} zoom={6} style={{ height: '600px', width: '100%' }} className="z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={MAKKAH_COORDS} icon={kaabaIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg text-primary mb-2">🕋 Makkah al-Mukarramah</h3>
                <p className="text-sm">The Holy City and destination of all Hajj pilgrims.</p>
              </div>
            </Popup>
          </Marker>

          {points.map((point) => (
            <div key={point.id}>
              <Marker position={[point.lat, point.lng]} icon={createIcon(point.color)}>
                <Popup maxWidth={400}>
                  <div className="p-4">
                    <h3 className="font-bold text-xl mb-3" style={{ color: point.color }}>
                      {point.name}
                    </h3>
                    <div className="space-y-2 mb-4 text-sm">
                      <p><strong>Direction:</strong> {point.direction}</p>
                      <p><strong>Distance:</strong> {point.distance}</p>
                      <p><strong>For:</strong> {point.forPilgrims}</p>
                      <p><strong>Modern:</strong> {point.modern}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white py-2 px-3 rounded text-center text-sm hover:bg-blue-600 transition-colors"
                      >
                        🗺️ Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-cyan-500 text-white py-2 px-3 rounded text-center text-sm hover:bg-cyan-600 transition-colors"
                      >
                        🚗 Waze
                      </a>
                    </div>
                    <button
                      onClick={() => handleGetDirections(point.lat, point.lng)}
                      className="w-full py-2 px-3 rounded text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: point.color }}
                    >
                      <Navigation className="inline w-4 h-4 mr-2" />
                      Get Directions from My Location
                    </button>
                  </div>
                </Popup>
              </Marker>

              {showLines && (
                <Polyline
                  positions={[[point.lat, point.lng], MAKKAH_COORDS]}
                  pathOptions={{ color: point.color, weight: 3, opacity: 0.7, dashArray: '10, 10' }}
                />
              )}
            </div>
          ))}
        </MapContainer>
      </div>

      <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">Meeqat Points Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {points.map((point) => (
            <div key={point.id} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: point.color }} />
              <span className="text-sm">{point.name.split(' (')[0]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕋</span>
            <span className="text-sm">Makkah</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          💡 Click markers for details &amp; directions
        </p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import HaramBoundaryMap from '../components/HaramBoundaryMap'
import { getHaramBoundaries } from '../api/client'
import type { HaramBoundary } from '../types'

export default function MapSites() {
  const [boundaries, setBoundaries] = useState<HaramBoundary[]>([])

  useEffect(() => {
    getHaramBoundaries()
      .then(setBoundaries)
      .catch((err) => console.error('Failed to load Haram boundaries:', err))
  }, [])

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary to-primary-light py-16 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sacred Boundaries of Makkah</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Learn about the Al-Haram sanctuary and the wider area around Makkah that has special rulings and
            virtues.
          </p>
        </div>
      </section>

      <section className="container-custom py-12">
        <HaramBoundaryMap />
      </section>

      <section className="container-custom pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-3xl font-bold text-primary mb-2">Understanding the Haram</h2>
            <p className="text-gray-700 leading-relaxed">
              The city of Makkah and its surrounding sanctuary, known as Al-Haram, have been honored by Allah
              with special rulings and protection. Within these sacred boundaries, hunting game, cutting trees,
              and causing harm are strictly prohibited, emphasizing peace and reverence.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Classical scholars describe specific boundary points around Makkah, often marked historically by
              stones or signs. Modern maps and signposts help pilgrims know when they are entering or leaving
              the Haram area.
            </p>

            {boundaries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {boundaries.map((b) => (
                  <div key={b.id} className="card p-5 border-l-4" style={{ borderColor: b.color ?? '#999' }}>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: b.color ?? '#555' }}>
                      {b.name}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{b.description}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      This represents one reference point on the Haram boundary; the actual sanctuary line
                      follows specific marked points and is not a perfect circle.
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                This page is a conceptual illustration of the sacred boundaries, designed to complement the
                interactive Meeqat map. For precise fiqh details, pilgrims should refer to qualified scholars
                and official guidance.
              </p>
            </div>
          </div>

          <div className="card p-6 h-fit">
            <h3 className="text-xl font-bold text-primary mb-4 text-center">Boundary Legend</h3>
            <ul className="space-y-4">
              {boundaries.map((b) => (
                <li key={b.id} className="flex items-start gap-3">
                  <span className="mt-1 w-4 h-4 rounded-full border" style={{ backgroundColor: b.color ?? '#999' }} />
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-gray-600">
                      Conceptual marker on the Haram boundary (not to scale or exact shape).
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-gray-500 text-center">
              The map above is an educational approximation. For precise fiqh boundaries, consult qualified
              scholars and official signage around Makkah.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

import MeeqatMap from '../components/MeeqatMap'
import MapErrorBoundary from '../components/MapErrorBoundary'
import PageHero from '../components/PageHero'
import { useMeta } from '../hooks/useMeta'

const meeqatSummary = [
  { name: 'Dhul-Hulayfah', for: 'Madinah and beyond', distance: '~450 km', color: 'border-red-500' },
  { name: 'Al-Juhfah', for: 'Syria, Egypt, Morocco', distance: '~187 km', color: 'border-blue-500' },
  { name: 'Qarn al-Manazil', for: 'Najd region', distance: '~94 km', color: 'border-amber-500' },
  { name: 'Yalamlam', for: 'Yemen and South', distance: '~120 km', color: 'border-purple-500' },
  { name: "Dhat 'Irq", for: 'Iraq and Northeast', distance: '~94 km', color: 'border-green-500' },
]

export default function MapRoute() {
  useMeta({
    title: 'Meeqat Points',
    description:
      'Explore the five Meeqat stations on an interactive map — the designated boundaries where pilgrims enter Ihram before approaching Makkah.',
  })

  return (
    <div className="min-h-screen">
      <PageHero
        title="The Meeqat Points"
        subtitle="Designated stations where pilgrims enter the state of Ihram before entering Makkah"
      />

      <section className="container-custom py-12">
        <MapErrorBoundary>
          <MeeqatMap />
        </MapErrorBoundary>
      </section>

      <section className="container-custom py-12">
        <div className="bg-gray-100 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Understanding the Meeqat</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            The Meeqat (ميقات, pl. مواقيت) are the designated stations where pilgrims must enter the
            state of Ihram before proceeding to Makkah. They were established by the Prophet ﷺ for
            people coming from different directions, and every pilgrim — whether arriving by land, sea,
            or air — must pass through or align with one of these points.
          </p>

          <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-primary mb-2">Directions to any Meeqat</h3>
            <p className="text-gray-700 leading-relaxed">
              Tap any marker on the map above to open its details. The <strong>Navigate</strong> button
              will open Google Maps with directions from your current location to that Meeqat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meeqatSummary.map((m) => (
              <div key={m.name} className={`bg-white p-6 rounded-lg border-l-4 ${m.color}`}>
                <h4 className="font-bold text-lg mb-2">{m.name}</h4>
                <p className="text-sm text-gray-600 mb-1"><strong>For:</strong> {m.for}</p>
                <p className="text-sm text-gray-600"><strong>Distance:</strong> {m.distance} from Makkah</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              <strong>Note:</strong> Pilgrims traveling by air typically enter Ihram before boarding
              their flight or at the designated facilities at King Abdulaziz International Airport in
              Jeddah. Consult a qualified scholar for the ruling specific to your route.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

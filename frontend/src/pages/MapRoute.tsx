import MeeqatMap from '../components/MeeqatMap'

const meeqatSummary = [
  { name: 'Dhul-Hulayfah', for: 'Madinah and beyond', distance: '~450 km', color: 'border-red-500' },
  { name: 'Al-Juhfah', for: 'Syria, Egypt, Morocco', distance: '~187 km', color: 'border-blue-500' },
  { name: 'Qarn al-Manazil', for: 'Najd region', distance: '~94 km', color: 'border-amber-500' },
  { name: 'Yalamlam', for: 'Yemen and South', distance: '~120 km', color: 'border-purple-500' },
  { name: "Dhat 'Irq", for: 'Iraq and Northeast', distance: '~94 km', color: 'border-green-500' },
]

export default function MapRoute() {
  return (
    <div className="min-h-screen">
      <section
        className="py-16 text-white"
        style={{ background: 'linear-gradient(135deg, #0f3d27 0%, #1a5f3f 55%, #2a7f5f 100%)' }}
      >
        <div className="container-custom text-center">
          <h1
            className="mb-4 text-white"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              letterSpacing: '-0.01em',
            }}
          >
            The Meeqat Points
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Designated stations where pilgrims enter the state of Ihram before entering Makkah
          </p>
        </div>
      </section>

      <section className="container-custom py-12">
        <MeeqatMap />
      </section>

      <section className="container-custom py-12">
        <div className="bg-gray-100 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Understanding the Meeqat</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            The Meeqat (\u0645\u064a\u0642\u0627\u062a) are the designated boundaries where pilgrims must enter the state of Ihram before
            entering the sacred territory of Makkah. These points were established by Prophet Muhammad \u0633 for
            people coming from different directions.
          </p>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white mb-8">
            <h3 className="text-xl font-bold mb-3">🧭 Get Directions to Any Meeqat</h3>
            <p className="leading-relaxed">
              Click on any Meeqat marker to access navigation options:
              <br />• <strong>Google Maps</strong> – Full turn-by-turn directions
              <br />• <strong>Waze</strong> – Live traffic and route optimization
              <br />• <strong>My Location</strong> – Automatic directions from where you are
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
              <strong>Important:</strong> Pilgrims traveling by air typically enter Ihram before boarding their
              flight or at special facilities at Jeddah airport. Modern pilgrims from all directions use these
              historic Meeqat points or their modern equivalents.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

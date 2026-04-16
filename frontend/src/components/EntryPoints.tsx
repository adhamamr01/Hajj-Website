import { Link } from 'react-router-dom'
import { BookOpen, Map, MapPin } from 'lucide-react'

const entryPoints = [
  {
    icon: BookOpen,
    title: 'The Journey',
    description:
      'Follow the complete narrative of Hajj, from preparation to the final farewell. Learn about each ritual, its significance, and the spiritual transformation pilgrims experience.',
    href: '/journey',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Map,
    title: 'Sacred Boundaries',
    description:
      'Explore the Al-Haram boundary and the greater Makkah territory. Discover the sacred zones and their significance in the pilgrimage.',
    href: '/map-sites',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: MapPin,
    title: 'Meeqat Points',
    description:
      'Navigate the complete Meeqat locations with an interactive map showing the stations where pilgrims enter Ihram. Get directions and explore each location.',
    href: '/map-route',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
]

export default function EntryPoints() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {entryPoints.map((point) => {
        const Icon = point.icon
        return (
          <div
            key={point.title}
            className="card group hover:scale-105 transition-transform duration-300 animate-slide-up"
          >
            <div
              className={`w-20 h-20 ${point.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}
            >
              <Icon className={`w-10 h-10 ${point.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4 text-center">{point.title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-center">{point.description}</p>
            <Link to={point.href} className="btn-primary w-full block text-center">
              Explore
            </Link>
          </div>
        )
      })}
    </div>
  )
}

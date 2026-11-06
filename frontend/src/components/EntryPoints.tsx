import { Link } from 'react-router-dom'
import { BookOpen, Map, MapPin } from 'lucide-react'
import { useTranslation } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/translations'

const entryPoints: {
  icon: typeof BookOpen
  title: TranslationKey
  description: TranslationKey
  href: string
  color: string
  bgColor: string
}[] = [
  {
    icon: BookOpen,
    title: 'entry.journey.title',
    description: 'entry.journey.description',
    href: '/journey',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Map,
    title: 'entry.boundaries.title',
    description: 'entry.boundaries.description',
    href: '/map-sites',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: MapPin,
    title: 'entry.meeqat.title',
    description: 'entry.meeqat.description',
    href: '/map-route',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
]

export default function EntryPoints() {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {entryPoints.map((point) => {
        const Icon = point.icon
        return (
          <div
            key={point.href}
            className="card group hover:scale-105 transition-transform duration-300 animate-slide-up"
          >
            <div
              className={`w-20 h-20 ${point.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}
            >
              <Icon className={`w-10 h-10 ${point.color}`} />
            </div>
            <h3 className="text-primary mb-4 text-center display-font font-semibold text-2xl">
              {t(point.title)}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-center">{t(point.description)}</p>
            <Link to={point.href} className="btn-primary w-full block text-center">
              {t('entry.explore')}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

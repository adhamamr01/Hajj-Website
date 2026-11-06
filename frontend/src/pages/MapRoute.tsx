import MeeqatMap from '../components/MeeqatMap'
import MapErrorBoundary from '../components/MapErrorBoundary'
import PageHero from '../components/PageHero'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'

const meeqatSummary = [
  { name: 'meeqatPage.dhulHulayfah.name', for: 'meeqatPage.dhulHulayfah.for', distance: 'meeqatPage.dhulHulayfah.distance', color: 'border-red-500' },
  { name: 'meeqatPage.alJuhfah.name', for: 'meeqatPage.alJuhfah.for', distance: 'meeqatPage.alJuhfah.distance', color: 'border-blue-500' },
  { name: 'meeqatPage.qarnAlManazil.name', for: 'meeqatPage.qarnAlManazil.for', distance: 'meeqatPage.qarnAlManazil.distance', color: 'border-amber-500' },
  { name: 'meeqatPage.yalamlam.name', for: 'meeqatPage.yalamlam.for', distance: 'meeqatPage.yalamlam.distance', color: 'border-purple-500' },
  { name: 'meeqatPage.dhatIrq.name', for: 'meeqatPage.dhatIrq.for', distance: 'meeqatPage.dhatIrq.distance', color: 'border-green-500' },
] as const

export default function MapRoute() {
  const { t } = useTranslation()
  useMeta({
    title: t('meeqatPage.metaTitle'),
    description: t('meeqatPage.metaDescription'),
  })

  return (
    <div className="min-h-screen">
      <PageHero
        title={t('meeqatPage.heroTitle')}
        subtitle={t('meeqatPage.heroSubtitle')}
      />

      <section className="container-custom py-12">
        <MapErrorBoundary>
          <MeeqatMap />
        </MapErrorBoundary>
      </section>

      <section className="container-custom py-12">
        <div className="bg-gray-100 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">{t('meeqatPage.understandingTitle')}</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {t('meeqatPage.understandingBody')}
          </p>

          <div className="bg-primary/5 border-s-4 border-primary rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-primary mb-2">{t('meeqatPage.directionsTitle')}</h3>
            <p className="text-gray-700 leading-relaxed">
              {t('meeqatPage.directionsBefore')}<strong>{t('meeqatMap.navigate')}</strong>{t('meeqatPage.directionsAfter')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meeqatSummary.map((m) => (
              <div key={m.name} className={`bg-white p-6 rounded-lg border-s-4 ${m.color}`}>
                <h4 className="font-bold text-lg mb-2">{t(m.name)}</h4>
                <p className="text-sm text-gray-600 mb-1"><strong>{t('meeqatPage.forLabel')}</strong> {t(m.for)}</p>
                <p className="text-sm text-gray-600"><strong>{t('meeqatPage.distanceLabel')}</strong> {t(m.distance)} {t('meeqatPage.fromMakkah')}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-green-50 border-s-4 border-green-500 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              <strong>{t('meeqatPage.noteLabel')}</strong> {t('meeqatPage.noteBody')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

import HaramBoundaryMap from '../components/HaramBoundaryMap'
import MapErrorBoundary from '../components/MapErrorBoundary'
import PageHero from '../components/PageHero'
import { getHaramBoundaries } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'

export default function MapSites() {
  const { t, pick } = useTranslation()
  useMeta({
    title: t('boundariesPage.metaTitle'),
    description: t('boundariesPage.metaDescription'),
  })

  const { data: boundaries, loading: bLoading, error: bError, retry: bRetry } = useApi(
    getHaramBoundaries,
    t('boundariesPage.loadError'),
  )

  const safeBoundaries = boundaries ?? []

  return (
    <div className="min-h-screen">
      <PageHero
        title={t('boundariesPage.heroTitle')}
        subtitle={t('boundariesPage.heroSubtitle')}
      />

      <section className="container-custom py-12">
        <MapErrorBoundary>
          <HaramBoundaryMap />
        </MapErrorBoundary>
      </section>

      <section className="container-custom pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-3xl font-bold text-primary mb-2">{t('boundariesPage.heading')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('boundariesPage.paragraph1')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('boundariesPage.paragraph2')}
            </p>

            {/* Boundaries error */}
            {bError && (
              <div className="bg-red-50 border-s-4 border-red-400 p-4 rounded-lg flex items-center justify-between gap-4">
                <p className="text-red-700 text-sm">{t('boundariesPage.loadError')}</p>
                <button onClick={bRetry} className="btn-primary text-sm py-1.5 px-4 flex-shrink-0">
                  {t('common.retry')}
                </button>
              </div>
            )}

            {/* Boundaries loading shimmer */}
            {bLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[1, 2].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32" />)}
              </div>
            )}

            {safeBoundaries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {safeBoundaries.map(b => (
                  <div key={b.id} className="card p-5 border-s-4" style={{ borderColor: b.color ?? '#999' }}>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: b.color ?? '#555' }}>
                      {pick(b.name, b.nameAr)}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{pick(b.description, b.descriptionAr)}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      {t('boundariesPage.cardNote')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border-s-4 border-blue-500 p-5 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {t('boundariesPage.disclaimer')}
              </p>
            </div>
          </div>

          {/* Sidebar legend */}
          <div className="card p-6 h-fit">
            <h3 className="text-xl font-bold text-primary mb-4 text-center">{t('boundariesPage.legendTitle')}</h3>
            {bLoading && (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
              </div>
            )}
            <ul className="space-y-4">
              {safeBoundaries.map(b => (
                <li key={b.id} className="flex items-start gap-3">
                  {/* Larger touch-friendly dot */}
                  <span
                    className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border"
                    style={{ backgroundColor: b.color ?? '#999' }}
                  />
                  <div>
                    <p className="font-semibold">{pick(b.name, b.nameAr)}</p>
                    <p className="text-sm text-gray-600">
                      {t('boundariesPage.legendItem')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-gray-500 text-center">
              {t('boundariesPage.legendFooter')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

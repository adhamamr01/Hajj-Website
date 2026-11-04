import { getJourneySteps } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import ContentSkeleton from '../components/ContentSkeleton'
import PageHero from '../components/PageHero'
import { useTranslation } from '../i18n/I18nProvider'

export default function Journey() {
  const { t, pick } = useTranslation()
  useMeta({
    title: t('journey.metaTitle'),
    description: t('journey.metaDescription'),
  })

  const { data: steps, loading, error, retry } = useApi(
    getJourneySteps,
    t('journey.loadError'),
  )

  return (
    <div className="min-h-screen">
      <PageHero
        title={t('journey.heroTitle')}
        subtitle={t('journey.heroSubtitle')}
      />

      <section className="container-custom py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center mb-8">
            <h2 className="hero-title text-primary mb-2" style={{ fontSize: '2rem' }}>
              {t('journey.overviewTitle')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('journey.overviewIntro')}
            </p>
          </div>

          {loading && <ContentSkeleton rows={7} />}

          {error && (
            <div className="bg-red-50 border-s-4 border-red-500 p-6 rounded-lg">
              <p className="text-red-700 font-medium">{t('journey.loadError')}</p>
              <button onClick={retry} className="mt-3 btn-primary text-sm py-2 px-4">
                {t('common.retry')}
              </button>
            </div>
          )}

          {!loading && !error && (
            <ol className="space-y-8">
              {(steps ?? []).map((step) => (
                <li key={step.id} className={`card p-6 border-s-4 ${step.borderColor ?? 'border-gray-400'}`}>
                  <h3 className={`text-2xl font-semibold mb-2 ${step.titleColor ?? 'text-gray-700'}`}>
                    {step.stepNumber}. {pick(step.title, step.titleAr)}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{pick(step.description, step.descriptionAr)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  )
}

import { getJourneySteps } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import ContentSkeleton from '../components/ContentSkeleton'
import PageHero from '../components/PageHero'

export default function Journey() {
  useMeta({
    title: 'The Journey of Hajj',
    description:
      'Follow the complete step-by-step narrative of Hajj — from intention and Ihram through the farewell Tawaf — with explanations of each major rite.',
  })

  const { data: steps, loading, error, retry } = useApi(
    getJourneySteps,
    'Failed to load journey steps. Is the backend running?',
  )

  return (
    <div className="min-h-screen">
      <PageHero
        title="The Journey of Hajj"
        subtitle="Follow the step-by-step spiritual journey from intention to farewell Tawaf, understanding each major rite along the way."
      />

      <section className="container-custom py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center mb-8">
            <h2 className="hero-title text-primary mb-2" style={{ fontSize: '2rem' }}>
              Overview of the Pilgrimage
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This page gives a high-level narrative of the Hajj journey. It is not a fiqh ruling, but an
              educational overview to pair with the interactive maps in this site.
            </p>
          </div>

          {loading && <ContentSkeleton rows={7} />}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={retry} className="mt-3 btn-primary text-sm py-2 px-4">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <ol className="space-y-8">
              {(steps ?? []).map((step) => (
                <li key={step.id} className={`card p-6 border-l-4 ${step.borderColor ?? 'border-gray-400'}`}>
                  <h3 className={`text-2xl font-semibold mb-2 ${step.titleColor ?? 'text-gray-700'}`}>
                    {step.stepNumber}. {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{step.description}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  )
}

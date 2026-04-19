import { useState, useEffect } from 'react'
import { getJourneySteps } from '../api/client'
import type { JourneyStep } from '../types'
import { useMeta } from '../hooks/useMeta'
import ContentSkeleton from '../components/ContentSkeleton'

export default function Journey() {
  useMeta({
    title: 'The Journey of Hajj',
    description:
      'Follow the complete step-by-step narrative of Hajj — from intention and Ihram through the farewell Tawaf — with explanations of each major rite.',
  })

  const [steps, setSteps] = useState<JourneyStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getJourneySteps()
      .then(setSteps)
      .catch(() => setError('Failed to load journey steps. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

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
            The Journey of Hajj
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Follow the step-by-step spiritual journey from intention to farewell Tawaf, understanding each major
            rite along the way.
          </p>
        </div>
      </section>

      <section className="container-custom py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center mb-8">
            <h2
              className="text-primary mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: '2rem',
              }}
            >
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
              <button
                onClick={() => { setError(null); setLoading(true); getJourneySteps().then(setSteps).catch(() => setError('Failed to load journey steps. Is the backend running?')).finally(() => setLoading(false)) }}
                className="mt-3 btn-primary text-sm py-2 px-4"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <ol className="space-y-8">
              {steps.map((step) => (
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

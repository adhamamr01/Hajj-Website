import { useState, useEffect } from 'react'
import { getJourneySteps } from '../api/client'
import type { JourneyStep } from '../types'

export default function Journey() {
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
      <section className="bg-gradient-to-br from-primary to-primary-light py-16 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The Journey of Hajj</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Follow the step-by-step spiritual journey from intention to farewell Tawaf, understanding each major
            rite along the way.
          </p>
        </div>
      </section>

      <section className="container-custom py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Overview of the Pilgrimage</h2>
            <p className="text-gray-700 leading-relaxed">
              This page gives a high-level narrative of the Hajj journey. It is not a fiqh ruling, but an
              educational overview to pair with the interactive maps in this site.
            </p>
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-500">Loading journey steps...</div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg text-red-700">{error}</div>
          )}

          {!loading && !error && (
            <ol className="space-y-8">
              {steps.map((step) => (
                <li key={step.id} className={`card p-6 border-l-4 ${step.borderColor}`}>
                  <h3 className={`text-2xl font-semibold mb-2 ${step.titleColor}`}>
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

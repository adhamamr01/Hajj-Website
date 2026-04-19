import Hero from '../components/Hero'
import EntryPoints from '../components/EntryPoints'
import InfoSection from '../components/InfoSection'
import { useMeta } from '../hooks/useMeta'

export default function Home() {
  useMeta({
    title: 'Journey to Hajj',
    description:
      'An interactive guide to the sacred pilgrimage of Hajj — explore the Meeqat points, sacred boundaries, and the step-by-step spiritual journey.',
  })
  return (
    <>
      <Hero />
      <section className="container-custom py-16">
        <div className="text-center mb-12">
          <h2
            className="text-primary mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '2.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Embark on a Spiritual Journey
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hajj is one of the five pillars of Islam, a sacred pilgrimage to Makkah that every Muslim who is
            physically and financially able must undertake at least once in their lifetime. Discover the profound
            spiritual experience, the historic sites, and the journey of millions of believers.
          </p>
        </div>
        <EntryPoints />
      </section>
      <InfoSection />
    </>
  )
}

import Hero from '../components/Hero'
import EntryPoints from '../components/EntryPoints'
import InfoSection from '../components/InfoSection'
import { LINK_ONLY } from '../config'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'

export default function Home() {
  const { t } = useTranslation()
  useMeta({
    title: t('site.name'),
    description: t('home.metaDescription'),
  })
  return (
    <>
      <Hero />
      <section className="container-custom py-16">
        <div className="text-center mb-12">
          <h2
            className="text-primary mb-4 display-font font-semibold"
            style={{ fontSize: '2.5rem' }}
          >
            {t('home.heading')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('home.intro')}
          </p>
        </div>
        {!LINK_ONLY && <EntryPoints />}
      </section>
      <InfoSection />
    </>
  )
}

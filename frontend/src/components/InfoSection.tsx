import { useTranslation } from '../i18n/I18nProvider'

const stats = [
  { value: 'stats.pilgrims.value', label: 'stats.pilgrims.label' },
  { value: 'stats.duration.value', label: 'stats.duration.label' },
  { value: 'stats.years.value', label: 'stats.years.label' },
] as const

export default function InfoSection() {
  const { t } = useTranslation()
  return (
    <section className="bg-gradient-to-br from-primary to-primary-light py-16 my-16 rounded-2xl mx-4 md:mx-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          {stats.map((stat, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
              <h4 className="text-4xl font-bold mb-3 text-secondary">{t(stat.value)}</h4>
              <p className="text-lg text-white/95">{t(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

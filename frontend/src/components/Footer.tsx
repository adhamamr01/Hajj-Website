import { archSvgUrl } from '../assets/silhouettes'
import { useTranslation } from '../i18n/I18nProvider'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-16" style={{ background: '#111827' }}>
      {/* Arch silhouette transition from page to footer */}
      <img
        src={archSvgUrl('#111827', 0.9)}
        aria-hidden="true"
        className="w-full block"
        style={{ height: 64, marginBottom: -2 }}
      />

      <div className="bg-gray-900 py-8">
        <div className="container-custom text-center">
          <p className="text-secondary mb-1 display-font text-lg">{t('site.name')}</p>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {t('footer.credit')}
          </p>
        </div>
      </div>
    </footer>
  )
}

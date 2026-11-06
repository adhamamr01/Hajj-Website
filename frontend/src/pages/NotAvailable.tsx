import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'

/**
 * Shown in link-only mode for every address that is not a valid secret link.
 * Deliberately has no links; the language switch lives in the Navbar.
 */
export default function NotAvailable() {
  const { t } = useTranslation()
  useMeta({
    title: t('unavailable.metaTitle'),
    description: t('unavailable.metaDescription'),
  })

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl">🕋</p>
        <h1 className="text-4xl font-semibold text-primary display-font">{t('unavailable.heading')}</h1>
        <p className="text-stone-500 text-lg">{t('unavailable.text')}</p>
      </div>
    </div>
  )
}

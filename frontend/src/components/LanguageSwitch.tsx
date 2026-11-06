import { useTranslation } from '../i18n/I18nProvider'

interface Props {
  className?: string
}

/**
 * Self-contained English / Arabic toggle. Shows the name of the language it
 * will switch TO, written in that language. Safe to place anywhere inside I18nProvider.
 */
export default function LanguageSwitch({ className = '' }: Props) {
  const { t, locale, setLocale } = useTranslation()
  const target = locale === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      onClick={() => setLocale(target)}
      aria-label={t('lang.switchLabel')}
      className={`rounded-full border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-colors ${className}`}
    >
      <span lang={target}>{t('lang.switchText')}</span>
    </button>
  )
}

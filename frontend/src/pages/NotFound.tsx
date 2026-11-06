import { Link } from 'react-router-dom'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'

export default function NotFound() {
  const { t } = useTranslation()
  useMeta({
    title: t('notFound.metaTitle'),
    description: t('notFound.metaDescription'),
  })

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl">🕋</p>
        <h1 className="text-4xl font-semibold text-primary display-font">{t('notFound.heading')}</h1>
        <p className="text-stone-500 text-lg">
          {t('notFound.text')}
        </p>
        <Link to="/" className="btn-primary inline-block py-3 px-8">
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  )
}

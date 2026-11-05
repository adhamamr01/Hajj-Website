import { Link } from 'react-router-dom'
import { getArticles } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'
import ContentSkeleton from '../components/ContentSkeleton'
import PageHero from '../components/PageHero'
import { formatDate } from '../utils/date'

/** List of published articles (normal mode only; link-only mode has no list). */
export default function Articles() {
  const { t, locale, pick } = useTranslation()
  useMeta({
    title: t('articles.metaTitle'),
    description: t('articles.metaDescription'),
  })

  const { data: articles, loading, error, retry } = useApi(getArticles, t('articles.loadError'))

  return (
    <div className="min-h-screen">
      <PageHero title={t('articles.heroTitle')} subtitle={t('articles.heroSubtitle')} />

      <section className="container-custom py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {loading && <ContentSkeleton rows={3} />}

          {error && (
            <div className="bg-red-50 border-s-4 border-red-500 p-6 rounded-lg">
              <p className="text-red-700 font-medium">{t('articles.loadError')}</p>
              <button onClick={retry} className="mt-3 btn-primary text-sm py-2 px-4">
                {t('common.retry')}
              </button>
            </div>
          )}

          {!loading && !error && (articles ?? []).length === 0 && (
            <p className="text-center text-gray-600">{t('articles.empty')}</p>
          )}

          {!loading && !error && (
            <ul className="space-y-6">
              {(articles ?? []).map((a) => (
                <li key={a.id} className="card p-6 border-s-4 border-primary">
                  <h2 className="text-2xl text-primary mb-2">
                    <Link to={`/articles/${a.id}`} className="hover:text-primary-light">
                      {pick(a.titleEn, a.titleAr)}
                    </Link>
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{pick(a.summaryEn, a.summaryAr)}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatDate(a.publishedAt, locale)}</span>
                    <Link to={`/articles/${a.id}`} className="font-medium text-primary hover:text-primary-light">
                      {t('articles.read')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

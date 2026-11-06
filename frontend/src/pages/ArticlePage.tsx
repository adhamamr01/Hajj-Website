import { useParams } from 'react-router-dom'
import { getArticle } from '../api/client'
import { LINK_ONLY } from '../config'
import { useApi } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import { useTranslation } from '../i18n/I18nProvider'
import ArticleView from '../components/ArticleView'
import ContentSkeleton from '../components/ContentSkeleton'
import NotAvailable from './NotAvailable'
import NotFound from './NotFound'

/** One published article, in the visitor's language (English when the Arabic field is empty). */
export default function ArticlePage({ id }: { id: string }) {
  const { t, locale, pick } = useTranslation()
  const { data: article, loading, error, retry } = useApi(() => getArticle(id), t('article.loadError'))

  useMeta({
    title: article ? pick(article.titleEn, article.titleAr) : t('articles.metaTitle'),
    description: article ? pick(article.summaryEn, article.summaryAr) : t('articles.metaDescription'),
  })

  if (loading) {
    return (
      <div className="container-custom py-12 max-w-3xl">
        <ContentSkeleton rows={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-custom py-16">
        <div className="bg-red-50 border-s-4 border-red-500 p-6 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={retry} className="mt-3 btn-primary text-sm py-2 px-4">
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!article) return LINK_ONLY ? <NotAvailable /> : <NotFound />

  return <ArticleView article={article} locale={locale} />
}

/** Route element for /articles/:id. Keyed so a different id is a fresh fetch. */
export function ArticleRoute() {
  const { id = '' } = useParams()
  return <ArticlePage key={id} id={id} />
}

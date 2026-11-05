import Markdown from './Markdown'
import { pickLocalized } from '../i18n/pick'
import { translations, type Locale } from '../i18n/translations'
import { formatDate } from '../utils/date'
import type { Article } from '../types'

interface Props {
  article: Article
  /** The language to show; Arabic falls back to English per field when empty. */
  locale: Locale
}

const hasText = (s: string | undefined | null) => !!s && s.trim() !== ''

/**
 * The article exactly as a visitor sees it. Shared by ArticlePage and the admin
 * preview, which is why the language is a prop rather than read from context.
 */
export default function ArticleView({ article, locale }: Props) {
  const title = pickLocalized(locale, article.titleEn ?? '', article.titleAr)
  const summary = pickLocalized(locale, article.summaryEn ?? '', article.summaryAr)
  const body = pickLocalized(locale, article.bodyEn ?? '', article.bodyAr)
  // If Arabic was asked for but the body fell back to English, keep the body left-to-right.
  const bodyIsArabic = locale === 'ar' && hasText(article.bodyAr)
  const date = formatDate(article.publishedAt, locale)

  return (
    <article lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <h1 dir="auto" className="hero-title text-primary mb-4">{title}</h1>
        {hasText(summary) && (
          <p dir="auto" className="text-xl text-gray-600 leading-relaxed mb-4">{summary}</p>
        )}
        {date && (
          <p className="text-sm text-gray-500 mb-8">
            <time dateTime={article.publishedAt}>
              {translations[locale]['article.publishedOn'].replace('{date}', date)}
            </time>
          </p>
        )}
        <div lang={bodyIsArabic ? 'ar' : 'en'} dir={bodyIsArabic ? 'rtl' : 'ltr'}>
          <Markdown>{body}</Markdown>
        </div>
      </div>
    </article>
  )
}

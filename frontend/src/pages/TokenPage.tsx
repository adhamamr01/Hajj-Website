import { lazy, useCallback, useEffect } from 'react'
import type { ComponentType } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { resolveLink, setPageToken } from '../api/client'
import { LINK_ONLY } from '../config'
import { useApi } from '../hooks/useApi'
import { useTranslation } from '../i18n/I18nProvider'
import { trackView } from '../components/Analytics'
import PageSkeleton from '../components/PageSkeleton'
import Home from './Home'
import Journey from './Journey'
import NotAvailable from './NotAvailable'
import NotFound from './NotFound'

const MapRoute = lazy(() => import('./MapRoute'))
const MapSites = lazy(() => import('./MapSites'))
const ArticlePage = lazy(() => import('./ArticlePage'))

/** Page key (from /api/links/:token) → component, for link-only mode. */
const PAGES: Record<string, ComponentType> = {
  home: Home,
  journey: Journey,
  meeqat: MapRoute,
  boundaries: MapSites,
}

/** Page key → the readable path it lives at when link-only is off. */
const READABLE_PATHS: Record<string, string> = {
  home: '/',
  journey: '/journey',
  meeqat: '/map-route',
  boundaries: '/map-sites',
}

/**
 * Route element for /p/:token.
 *   link-only on  → renders the page in place (URL stays /p/token) and sends the
 *                   token with content requests; unknown token → NotAvailable.
 *   link-only off → forwards old links to the readable URL; unknown → NotFound.
 */
export default function TokenPage() {
  const { token = '' } = useParams()
  // key: a different token is a fresh lookup, never a reuse of the previous state
  return <ResolvedLink key={token} token={token} />
}

function ResolvedLink({ token }: { token: string }) {
  const { t } = useTranslation()

  // The token is registered with the API client as soon as it resolves, so it is
  // set before the page below mounts and starts its content requests.
  const lookup = useCallback(
    () =>
      resolveLink(token).then((link) => {
        if (link && LINK_ONLY) setPageToken(token)
        return link
      }),
    [token],
  )
  const { data: link, loading, error, retry } = useApi(lookup, t('error.app.text'))

  const rawKey = link?.type === 'PAGE' ? link.key : undefined
  const key = rawKey !== undefined && Object.prototype.hasOwnProperty.call(PAGES, rawKey) ? rawKey : undefined

  const articleId = link?.type === 'ARTICLE' && /^\d+$/.test(link.key) ? link.key : undefined

  useEffect(() => {
    // Record the page key (or "article:<id>"), never the URL: the URL contains the secret.
    if (LINK_ONLY && key) trackView(key)
    if (LINK_ONLY && articleId) trackView(`article:${articleId}`)
  }, [key, articleId])

  if (loading) return <PageSkeleton />

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

  if (articleId) return LINK_ONLY ? <ArticlePage id={articleId} /> : <Navigate to={`/articles/${articleId}`} replace />
  if (!key) return LINK_ONLY ? <NotAvailable /> : <NotFound />
  if (!LINK_ONLY) return <Navigate to={READABLE_PATHS[key]} replace />

  const Page = PAGES[key]
  return <Page />
}

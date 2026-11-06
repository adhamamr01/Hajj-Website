import { useCallback, useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import ArticleEditor from './ArticleEditor'
import ContentList, { type AdminData } from './ContentList'
import KeyScreen from './KeyScreen'
import {
  AdminAuthError, errorMessage, listArticles, listLinks,
  type AdminArticle, type AdminArticleSummary,
} from './adminApi'

const KEY_STORAGE = 'adminKey'

// The key lives in sessionStorage only: gone when the tab closes, never in localStorage.
const readKey = (): string | null => {
  try {
    return sessionStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}
const writeKey = (key: string) => {
  try {
    sessionStorage.setItem(KEY_STORAGE, key)
  } catch {
    // storage blocked — the key is kept in memory for this page only
  }
}
const clearKey = () => {
  try {
    sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    // nothing to clear
  }
}

type View = { name: 'list' } | { name: 'edit'; id: number | null }

const toSummary = (a: AdminArticle): AdminArticleSummary => ({
  id: a.id,
  titleEn: a.titleEn,
  titleAr: a.titleAr,
  status: a.status,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  publishedAt: a.publishedAt,
  linkToken: a.linkToken,
})

/** Keeps the admin page out of search results, whatever mode the site is in. */
function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !meta
    const previous = meta?.getAttribute('content') ?? null
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex, nofollow')
    const previousTitle = document.title
    document.title = 'Admin'
    return () => {
      document.title = previousTitle
      if (created) meta?.remove()
      else if (previous !== null) meta?.setAttribute('content', previous)
    }
  }, [])
}

/**
 * The admin tool, loaded lazily at /<VITE_ADMIN_PATH>. English-only UI.
 * Loads the article list and links once; saves update this local state from the
 * server's responses instead of reloading, to stay inside the admin rate limit.
 */
export default function AdminApp() {
  useNoIndex()

  const [key, setKey] = useState<string | null>(readKey)
  const [notice, setNotice] = useState<string | null>(null)
  const [data, setData] = useState<AdminData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ name: 'list' })
  const [loadTick, setLoadTick] = useState(0)

  const signOut = useCallback((message?: string) => {
    clearKey()
    setKey(null)
    setData(null)
    setView({ name: 'list' })
    setNotice(message ?? null)
  }, [])

  const rejected = useCallback(() => signOut('That admin key was not accepted. Please try again.'), [signOut])

  useEffect(() => {
    if (!key) return
    let cancelled = false
    setLoadError(null)
    Promise.all([listArticles(key), listLinks(key)])
      .then(([articles, links]) => {
        if (!cancelled) setData({ articles, links })
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof AdminAuthError) rejected()
        else setLoadError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [key, loadTick, rejected])

  const submitKey = (value: string) => {
    writeKey(value)
    setNotice(null)
    setKey(value)
  }

  const onSaved = useCallback((article: AdminArticle) => {
    setData((d) => {
      if (!d) return d
      const summary = toSummary(article)
      const exists = d.articles.some((a) => a.id === summary.id)
      return {
        ...d,
        articles: exists ? d.articles.map((a) => (a.id === summary.id ? summary : a)) : [summary, ...d.articles],
      }
    })
  }, [])

  return (
    <div dir="ltr" lang="en" className="min-h-screen" style={{ background: 'var(--bg-2)' }}>
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="display-font text-2xl font-semibold">Hajj Guide · Admin</span>
          {key && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/80">Key active until tab closes</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 rounded-lg border border-white/50 px-3 py-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <LogOut size={16} aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        {!key && <KeyScreen notice={notice} onSubmit={submitKey} />}

        {key && loadError && (
          <div className="mx-auto max-w-6xl px-4 py-8">
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{loadError}</p>
            <button type="button" className="btn-primary mt-4 py-2 px-4" onClick={() => setLoadTick((t) => t + 1)}>
              Retry
            </button>
          </div>
        )}

        {key && !loadError && !data && (
          <div role="status" className="mx-auto max-w-6xl px-4 py-8 text-gray-600">Loading…</div>
        )}

        {key && data && view.name === 'list' && (
          <ContentList
            adminKey={key}
            data={data}
            onChange={(update) => setData((d) => (d ? update(d) : d))}
            onNew={() => setView({ name: 'edit', id: null })}
            onEdit={(id) => setView({ name: 'edit', id })}
            onAuthError={rejected}
          />
        )}

        {key && data && view.name === 'edit' && (
          <ArticleEditor
            // A different article (or "new") is a fresh editor, never a reuse of the old state.
            key={view.id ?? 'new'}
            adminKey={key}
            articleId={view.id}
            onSaved={onSaved}
            onBack={() => setView({ name: 'list' })}
            onAuthError={rejected}
          />
        )}
      </main>
    </div>
  )
}

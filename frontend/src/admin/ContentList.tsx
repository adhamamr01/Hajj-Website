import { useState } from 'react'
import { Copy, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { translations } from '../i18n/translations'
import ConfirmDialog from './ConfirmDialog'
import {
  AdminAuthError, deleteArticle, errorMessage, resetLink,
  type AdminArticleSummary, type AdminLink,
} from './adminApi'

export interface AdminData {
  articles: AdminArticleSummary[]
  links: AdminLink[]
}

interface Props {
  adminKey: string
  data: AdminData
  onChange: (update: (data: AdminData) => AdminData) => void
  onNew: () => void
  onEdit: (id: number) => void
  onAuthError: () => void
}

type Filter = 'all' | 'pages' | 'articles' | 'drafts'

interface Row {
  id: string
  kind: 'page' | 'article'
  titleEn: string
  titleAr: string | null
  status: 'Live' | 'Published' | 'Draft'
  token: string | null
  /** A link can be reset only while its target is publicly reachable. */
  canReset: boolean
  pageKey?: string
  articleId?: number
}

const PAGES: { key: string; label: 'nav.home' | 'nav.journey' | 'nav.meeqat' | 'nav.boundaries' }[] = [
  { key: 'home', label: 'nav.home' },
  { key: 'journey', label: 'nav.journey' },
  { key: 'meeqat', label: 'nav.meeqat' },
  { key: 'boundaries', label: 'nav.boundaries' },
]

const STATUS_STYLE: Record<Row['status'], string> = {
  Live: 'bg-green-100 text-green-800',
  Published: 'bg-green-100 text-green-800',
  Draft: 'bg-amber-100 text-amber-800',
}

type Pending = { action: 'reset' | 'delete'; row: Row }

function buildRows({ articles, links }: AdminData): Row[] {
  const pageRows: Row[] = PAGES.map((p) => ({
    id: `page-${p.key}`,
    kind: 'page',
    titleEn: translations.en[p.label],
    titleAr: translations.ar[p.label],
    status: 'Live',
    token: links.find((l) => l.type === 'PAGE' && l.key === p.key)?.token ?? null,
    canReset: true,
    pageKey: p.key,
  }))
  const articleRows: Row[] = articles.map((a) => ({
    id: `article-${a.id}`,
    kind: 'article',
    titleEn: a.titleEn?.trim() || '(Untitled)',
    titleAr: a.titleAr?.trim() || null,
    status: a.status === 'PUBLISHED' ? 'Published' : 'Draft',
    token: a.linkToken,
    canReset: a.status === 'PUBLISHED' && !!a.linkToken,
    articleId: a.id,
  }))
  return [...pageRows, ...articleRows]
}

/** Screen 1: every page and article with its status and secret link. */
export default function ContentList({ adminKey, data, onChange, onNew, onEdit, onAuthError }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const rows = buildRows(data)
  const counts: Record<Filter, number> = {
    all: rows.length,
    pages: rows.filter((r) => r.kind === 'page').length,
    articles: rows.filter((r) => r.kind === 'article').length,
    drafts: rows.filter((r) => r.kind === 'article' && r.status === 'Draft').length,
  }
  const visible = rows.filter(
    (r) =>
      filter === 'all' ||
      (filter === 'pages' && r.kind === 'page') ||
      (filter === 'articles' && r.kind === 'article') ||
      (filter === 'drafts' && r.kind === 'article' && r.status === 'Draft'),
  )

  const copyLink = async (row: Row) => {
    if (!row.token) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${row.token}`)
      setMessage({ text: `Link for "${row.titleEn}" copied.`, error: false })
    } catch {
      setMessage({ text: 'Could not copy automatically. Select the link and copy it by hand.', error: true })
    }
  }

  const confirm = async () => {
    if (!pending) return
    const { action, row } = pending
    setBusy(true)
    try {
      if (action === 'delete' && row.articleId !== undefined) {
        await deleteArticle(adminKey, row.articleId)
        onChange((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== row.articleId) }))
        setMessage({ text: `"${row.titleEn}" deleted.`, error: false })
      } else if (action === 'reset') {
        const link =
          row.kind === 'page'
            ? await resetLink(adminKey, 'PAGE', row.pageKey as string)
            : await resetLink(adminKey, 'ARTICLE', row.articleId as number)
        onChange((d) =>
          row.kind === 'page'
            ? { ...d, links: d.links.map((l) => (l.type === 'PAGE' && l.key === row.pageKey ? link : l)) }
            : { ...d, articles: d.articles.map((a) => (a.id === row.articleId ? { ...a, linkToken: link.token } : a)) },
        )
        setMessage({ text: `New link created for "${row.titleEn}". The old link no longer works.`, error: false })
      }
    } catch (err) {
      if (err instanceof AdminAuthError) {
        onAuthError()
        return
      }
      setMessage({ text: errorMessage(err), error: true })
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const iconButton =
    'rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <section aria-labelledby="content-heading" className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="content-heading" className="text-3xl font-semibold text-primary display-font">Content and links</h1>
        <button type="button" onClick={onNew} className="btn-primary inline-flex items-center gap-2 py-2 px-4">
          <Plus size={18} aria-hidden="true" /> New article
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter content">
        {(
          [
            ['all', 'All'],
            ['pages', 'Pages'],
            ['articles', 'Articles'],
            ['drafts', 'Drafts'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              filter === id ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className={`mt-4 min-h-[1.5rem] text-sm ${message?.error ? 'text-red-700' : 'text-green-800'}`}>
        {message?.text}
      </p>

      <div className="mt-2 overflow-x-auto rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[40rem] text-start">
          <thead>
            <tr className="border-b border-gray-200 text-start text-sm text-gray-600">
              <th scope="col" className="px-4 py-3 text-start font-medium">Title</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Type</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">Secret link</th>
              <th scope="col" className="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{row.titleEn}</div>
                  {row.titleAr && (
                    <div lang="ar" dir="rtl" className="text-sm text-gray-600 text-end">{row.titleAr}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.kind === 'page' ? 'Page' : 'Article'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.token ? (
                    <code className="text-sm text-gray-800">/p/{row.token}</code>
                  ) : (
                    <span className="text-sm italic text-gray-500">Made on publish</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className={iconButton}
                      disabled={!row.token}
                      aria-label={`Copy link for ${row.titleEn}`}
                      title="Copy link"
                      onClick={() => copyLink(row)}
                    >
                      <Copy size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      disabled={!row.canReset}
                      aria-label={`Reset link for ${row.titleEn}`}
                      title="Reset link"
                      onClick={() => setPending({ action: 'reset', row })}
                    >
                      <RefreshCw size={18} aria-hidden="true" />
                    </button>
                    {row.kind === 'article' && (
                      <>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Edit ${row.titleEn}`}
                          title="Edit"
                          onClick={() => onEdit(row.articleId as number)}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Delete ${row.titleEn}`}
                          title="Delete"
                          onClick={() => setPending({ action: 'delete', row })}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nothing here yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pending?.action === 'reset' && (
        <ConfirmDialog
          title="Reset secret link?"
          message={`The current link for "${pending.row.titleEn}" will stop working immediately, and anyone who has it will see "This page isn't available". A new link will be created for you to share.`}
          confirmLabel="Reset link"
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.action === 'delete' && (
        <ConfirmDialog
          title="Delete article?"
          message={`"${pending.row.titleEn}" will be deleted permanently, and its secret link will stop working. This cannot be undone.`}
          confirmLabel="Delete article"
          danger
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  )
}

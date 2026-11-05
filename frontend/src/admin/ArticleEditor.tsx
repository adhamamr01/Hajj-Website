import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Bold, Heading2, Image as ImageIcon, Italic, Link2, List } from 'lucide-react'
import ArticleView from '../components/ArticleView'
import type { Locale } from '../i18n/translations'
import ConfirmDialog from './ConfirmDialog'
import { applyMarkdown, type MarkdownAction } from './markdownTools'
import {
  AdminAuthError, createArticle, errorMessage, getArticle, publishArticle, unpublishArticle, updateArticle,
  type AdminArticle, type ArticleFields,
} from './adminApi'

const EMPTY: ArticleFields = { titleEn: '', titleAr: '', summaryEn: '', summaryAr: '', bodyEn: '', bodyAr: '' }

const fieldsOf = (a: AdminArticle): ArticleFields => ({
  titleEn: a.titleEn ?? '',
  titleAr: a.titleAr ?? '',
  summaryEn: a.summaryEn ?? '',
  summaryAr: a.summaryAr ?? '',
  bodyEn: a.bodyEn ?? '',
  bodyAr: a.bodyAr ?? '',
})

const REQUIRED: [keyof ArticleFields, string][] = [
  ['titleEn', 'English title'],
  ['summaryEn', 'English summary'],
  ['bodyEn', 'English body'],
  ['titleAr', 'Arabic title'],
  ['summaryAr', 'Arabic summary'],
  ['bodyAr', 'Arabic body'],
]

/** Names of the required fields that are still blank, e.g. "Arabic summary". */
export function missingFields(f: ArticleFields): string[] {
  return REQUIRED.filter(([key]) => f[key].trim() === '').map(([, label]) => label)
}

const sameFields = (a: ArticleFields, b: ArticleFields) => REQUIRED.every(([key]) => a[key] === b[key])

interface Meta {
  id: number | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
}

interface Props {
  adminKey: string
  /** null = a new article that has not been saved yet. */
  articleId: number | null
  /** Called with the server's copy after every successful save, publish or unpublish. */
  onSaved: (article: AdminArticle) => void
  onBack: () => void
  onAuthError: () => void
}

/** Screen 2: write an article in English and Arabic side by side. */
export default function ArticleEditor({ adminKey, articleId, onSaved, onBack, onAuthError }: Props) {
  const [form, setForm] = useState<ArticleFields>(EMPTY)
  const [saved, setSaved] = useState<ArticleFields>(EMPTY)
  const [meta, setMeta] = useState<Meta>({ id: articleId, status: 'DRAFT', publishedAt: null })
  const [loading, setLoading] = useState(articleId !== null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewLocale, setPreviewLocale] = useState<Locale>('en')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [loadTick, setLoadTick] = useState(0)

  useEffect(() => {
    if (articleId === null) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    getArticle(adminKey, articleId)
      .then((a) => {
        if (cancelled) return
        setForm(fieldsOf(a))
        setSaved(fieldsOf(a))
        setMeta({ id: a.id, status: a.status, publishedAt: a.publishedAt })
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof AdminAuthError) onAuthError()
        else setLoadError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [adminKey, articleId, loadTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = !sameFields(form, saved)
  const missing = missingFields(form)
  const published = meta.status === 'PUBLISHED'
  // A live article must stay complete: saving it with a blank field would put a gap in front of visitors.
  const saveBlocked = published && missing.length > 0
  const nothingToSave = meta.id === null ? sameFields(form, EMPTY) : !dirty

  // Warn before the tab closes or reloads with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = useCallback((field: keyof ArticleFields, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setNotice(null)
  }, [])

  const applyResult = (a: AdminArticle) => {
    setSaved(fieldsOf(a))
    setMeta({ id: a.id, status: a.status, publishedAt: a.publishedAt })
    onSaved(a)
  }

  /** Runs one server action, handling the busy flag and errors. Returns false when it failed. */
  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
      return true
    } catch (err) {
      if (err instanceof AdminAuthError) onAuthError()
      else setError(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  /** Creates or updates the article from the form; resolves to its id. */
  const persist = async (): Promise<number> => {
    const result = meta.id === null ? await createArticle(adminKey, form) : await updateArticle(adminKey, meta.id, form)
    applyResult(result)
    return result.id
  }

  const save = () =>
    run(async () => {
      await persist()
      setNotice(published ? 'Changes saved and live.' : 'Draft saved.')
    })

  const publish = () =>
    run(async () => {
      // Save first (only when needed) so what is published is exactly what is on screen.
      const id = meta.id === null || dirty ? await persist() : meta.id
      applyResult(await publishArticle(adminKey, id))
      setNotice('Published. Its secret link is in the content list.')
    })

  const unpublish = () =>
    run(async () => {
      const result = await unpublishArticle(adminKey, meta.id as number)
      // Only the status changes; keep whatever is being typed.
      setMeta({ id: result.id, status: result.status, publishedAt: result.publishedAt })
      onSaved(result)
      setNotice('Unpublished. The article is a draft again; its link is kept.')
    })

  const goBack = () => (dirty ? setConfirmLeave(true) : onBack())

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8" role="status">
        Loading article…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{loadError}</p>
        <div className="mt-4 flex gap-3">
          <button type="button" className="btn-primary py-2 px-4" onClick={() => setLoadTick((t) => t + 1)}>Retry</button>
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2" onClick={onBack}>Back to content</button>
        </div>
      </div>
    )
  }

  const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'

  return (
    <section aria-labelledby="editor-heading" className="mx-auto max-w-6xl px-4 py-8">
      <button
        type="button"
        onClick={goBack}
        className={`inline-flex items-center gap-1 rounded text-primary hover:text-primary-light ${focusRing}`}
      >
        <ArrowLeft size={18} aria-hidden="true" /> Back to content
      </button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="editor-heading" className="text-3xl font-semibold text-primary display-font">
            {meta.id === null ? 'New article' : 'Edit article'}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Article status">
            <li className={`rounded-full px-3 py-1 text-sm font-medium ${published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
              {published ? 'Published' : 'Draft'}
            </li>
            {dirty && <li className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">Unsaved changes</li>}
            {missing.map((label) => (
              <li key={label} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                {label} missing
              </li>
            ))}
            {missing.length === 0 && (
              <li className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Ready to publish</li>
            )}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={previewing}
            onClick={() => setPreviewing((p) => !p)}
            className={`rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
          >
            {previewing ? 'Back to editing' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || nothingToSave || saveBlocked}
            className={`rounded-lg border border-primary bg-white px-4 py-2 font-medium text-primary hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            {published ? 'Save changes' : 'Save draft'}
          </button>
          {published ? (
            <button
              type="button"
              onClick={unpublish}
              disabled={busy}
              className={`rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50 ${focusRing}`}
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              disabled={busy || missing.length > 0}
              aria-describedby={missing.length > 0 ? 'publish-hint' : undefined}
              className={`rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {missing.length > 0 && !published && (
        <p id="publish-hint" className="mt-2 text-sm text-gray-600">
          Publishing needs a title, summary and body in both languages.
        </p>
      )}
      {saveBlocked && (
        <p className="mt-2 text-sm text-amber-800">
          This article is live, so every field must stay filled in. Complete it, or unpublish to save a partial draft.
        </p>
      )}
      {published && !saveBlocked && (
        <p className="mt-2 text-sm text-gray-600">This article is live: saving changes updates it immediately.</p>
      )}
      <div aria-live="polite" role="status" className="mt-3 min-h-[1.5rem] text-sm text-green-800">{notice}</div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
      )}

      {previewing ? (
        <div className="mt-2">
          <div className="mb-3 flex items-center gap-2" role="group" aria-label="Preview language">
            {(['en', 'ar'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={previewLocale === l}
                onClick={() => setPreviewLocale(l)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${focusRing} ${
                  previewLocale === l ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {l === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
            <span className="text-sm text-gray-600">This is how visitors will see it.</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white">
            <ArticleView
              article={{
                id: meta.id ?? 0,
                ...form,
                publishedAt: meta.publishedAt ?? new Date().toISOString(),
              }}
              locale={previewLocale}
            />
          </div>
        </div>
      ) : (
        <div className="mt-2 grid gap-6 md:grid-cols-2">
          <LanguageColumn lang="en" form={form} onChange={change} />
          <LanguageColumn lang="ar" form={form} onChange={change} />
        </div>
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="Leave without saving?"
          message="You have unsaved changes. If you leave now, they will be lost."
          confirmLabel="Leave and discard"
          danger
          onConfirm={onBack}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </section>
  )
}

const COPY = {
  en: {
    heading: 'English',
    title: 'Title',
    summary: 'Summary',
    body: 'Body (Markdown)',
    dir: 'ltr' as const,
    fields: { title: 'titleEn', summary: 'summaryEn', body: 'bodyEn' } as const,
  },
  ar: {
    heading: 'العربية',
    title: 'العنوان',
    summary: 'الملخص',
    body: 'النص (Markdown)',
    dir: 'rtl' as const,
    fields: { title: 'titleAr', summary: 'summaryAr', body: 'bodyAr' } as const,
  },
}

const TOOLS: { action: MarkdownAction; label: string; Icon: typeof Bold }[] = [
  { action: 'bold', label: 'Bold', Icon: Bold },
  { action: 'italic', label: 'Italic', Icon: Italic },
  { action: 'h2', label: 'Heading', Icon: Heading2 },
  { action: 'list', label: 'Bulleted list', Icon: List },
  { action: 'link', label: 'Link', Icon: Link2 },
]

function LanguageColumn({
  lang,
  form,
  onChange,
}: {
  lang: 'en' | 'ar'
  form: ArticleFields
  onChange: (field: keyof ArticleFields, value: string) => void
}) {
  const c = COPY[lang]
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  // After a toolbar edit re-renders the textarea, put the cursor where the edit left it.
  useLayoutEffect(() => {
    const sel = pendingSelection.current
    if (sel && bodyRef.current) {
      bodyRef.current.focus()
      bodyRef.current.setSelectionRange(sel.start, sel.end)
      pendingSelection.current = null
    }
  })

  const insert = (action: MarkdownAction) => {
    const ta = bodyRef.current
    if (!ta) return
    const edit = applyMarkdown(action, ta.value, ta.selectionStart, ta.selectionEnd)
    pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd }
    onChange(c.fields.body, edit.value)
  }

  const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
  const toolButton =
    'rounded p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

  return (
    <fieldset lang={lang} dir={c.dir} className="rounded-xl bg-white p-4 shadow-card space-y-4">
      <legend className="px-2 text-lg font-semibold text-primary">{c.heading}</legend>

      <div>
        <label htmlFor={`title-${lang}`} className="mb-1 block text-sm font-medium text-gray-700">{c.title}</label>
        <input
          id={`title-${lang}`}
          type="text"
          maxLength={200}
          value={form[c.fields.title]}
          onChange={(e) => onChange(c.fields.title, e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label htmlFor={`summary-${lang}`} className="mb-1 block text-sm font-medium text-gray-700">{c.summary}</label>
        <input
          id={`summary-${lang}`}
          type="text"
          maxLength={500}
          value={form[c.fields.summary]}
          onChange={(e) => onChange(c.fields.summary, e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label htmlFor={`body-${lang}`} className="mb-1 block text-sm font-medium text-gray-700">{c.body}</label>
        <div dir="ltr" className="mb-1 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1" role="toolbar" aria-label={`${c.heading} formatting`}>
          {TOOLS.map(({ action, label, Icon }) => (
            <button
              key={action}
              type="button"
              className={toolButton}
              aria-label={`${label} (${lang === 'en' ? 'English' : 'Arabic'} body)`}
              title={label}
              onClick={() => insert(action)}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            className={toolButton}
            disabled
            aria-label="Insert photo (images coming soon)"
            title="Images coming soon"
          >
            <ImageIcon size={16} aria-hidden="true" />
          </button>
        </div>
        <textarea
          id={`body-${lang}`}
          ref={bodyRef}
          rows={16}
          maxLength={100000}
          value={form[c.fields.body]}
          onChange={(e) => onChange(c.fields.body, e.target.value)}
          className={`${input} min-h-[20rem] leading-relaxed`}
        />
      </div>
    </fieldset>
  )
}

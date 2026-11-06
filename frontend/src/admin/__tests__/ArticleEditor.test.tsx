import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArticleEditor, { missingFields } from '../ArticleEditor'

const api = vi.hoisted(() => ({
  getArticle: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  publishArticle: vi.fn(),
  unpublishArticle: vi.fn(),
}))

vi.mock('../adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../adminApi')>()),
  ...api,
}))

const onSaved = vi.fn()
const onBack = vi.fn()
const onAuthError = vi.fn()

const server = (over = {}) => ({
  id: 5,
  titleEn: 'T', titleAr: 'ع', summaryEn: 'S', summaryAr: 'م', bodyEn: 'B', bodyAr: 'ن',
  status: 'DRAFT', createdAt: '', updatedAt: '', publishedAt: null, linkToken: null,
  ...over,
})

function open(articleId: number | null = null) {
  return render(
    <ArticleEditor adminKey="k" articleId={articleId} onSaved={onSaved} onBack={onBack} onAuthError={onAuthError} />,
  )
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

function fillEverything() {
  type('Title', 'English title')
  type('Summary', 'English summary')
  type('Body (Markdown)', 'English body')
  type('العنوان', 'عنوان')
  type('الملخص', 'ملخص')
  type('النص (Markdown)', 'نص')
}

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset())
  onSaved.mockReset()
  onBack.mockReset()
  onAuthError.mockReset()
})
afterEach(cleanup)

describe('missingFields', () => {
  it('names every blank required field, English first', () => {
    expect(missingFields({ titleEn: 'x', titleAr: '', summaryEn: '  ', summaryAr: 'x', bodyEn: 'x', bodyAr: '' })).toEqual([
      'English summary',
      'Arabic title',
      'Arabic body',
    ])
  })
})

describe('publish readiness', () => {
  it('lists each missing field in amber and blocks Publish', () => {
    open()

    for (const label of ['English title', 'English summary', 'English body', 'Arabic title', 'Arabic summary', 'Arabic body']) {
      expect(screen.getByText(`${label} missing`)).toBeTruthy()
    }
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows only what is still missing, and enables Publish once everything is filled in', () => {
    open()
    type('Title', 'English title')
    type('Summary', 'English summary')
    type('Body (Markdown)', 'English body')
    type('العنوان', 'عنوان')
    type('النص (Markdown)', 'نص')

    expect(screen.getByText('Arabic summary missing')).toBeTruthy()
    expect(screen.queryByText('English title missing')).toBeNull()
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true)

    type('الملخص', 'ملخص')

    expect(screen.getByText('Ready to publish')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('treats whitespace-only text as missing', () => {
    open()
    fillEverything()
    type('الملخص', '   ')
    expect(screen.getByText('Arabic summary missing')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('labels the Arabic fields in Arabic and sets them right-to-left', () => {
    open()
    const title = screen.getByLabelText('العنوان')
    expect(title.closest('fieldset')?.getAttribute('dir')).toBe('rtl')
    expect(screen.getByLabelText('Title').closest('fieldset')?.getAttribute('dir')).toBe('ltr')
  })

  it('has a disabled photo button explaining images are coming', () => {
    open()
    const photo = screen.getAllByRole('button', { name: /insert photo/i })[0] as HTMLButtonElement
    expect(photo.disabled).toBe(true)
    expect(photo.getAttribute('title')).toBe('Images coming soon')
  })
})

describe('saving and publishing', () => {
  it('Save draft creates the article with every field, once', async () => {
    api.createArticle.mockResolvedValue(server())
    open()
    type('Title', 'Only English')

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(api.createArticle).toHaveBeenCalledWith('k', {
      titleEn: 'Only English', titleAr: '', summaryEn: '', summaryAr: '', bodyEn: '', bodyAr: '',
    })
    expect(screen.getByText('Draft saved.')).toBeTruthy()
  })

  it('later saves update the same article', async () => {
    api.createArticle.mockResolvedValue(server({ titleEn: 'One' }))
    api.updateArticle.mockResolvedValue(server({ titleEn: 'Two' }))
    open()
    type('Title', 'One')
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await screen.findByText('Draft saved.')

    type('Title', 'Two')
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(api.updateArticle).toHaveBeenCalledWith('k', 5, expect.objectContaining({ titleEn: 'Two' })))
    expect(api.createArticle).toHaveBeenCalledTimes(1)
  })

  it('Publish saves first, then publishes, and then offers Unpublish', async () => {
    api.createArticle.mockResolvedValue(server())
    api.publishArticle.mockResolvedValue(server({ status: 'PUBLISHED', publishedAt: '2026-11-05T00:00:00Z', linkToken: 'tok' }))
    open()
    fillEverything()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByRole('button', { name: 'Unpublish' })).toBeTruthy()
    expect(api.createArticle).toHaveBeenCalledTimes(1)
    expect(api.publishArticle).toHaveBeenCalledWith('k', 5)
    expect(api.createArticle.mock.invocationCallOrder[0]).toBeLessThan(api.publishArticle.mock.invocationCallOrder[0])
    expect(onSaved).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PUBLISHED' }))
  })

  it('shows the backend message when publishing is refused', async () => {
    api.createArticle.mockResolvedValue(server())
    api.publishArticle.mockRejectedValue({ response: { status: 400, data: { error: 'Cannot publish: missing Arabic body' } } })
    open()
    fillEverything()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Cannot publish: missing Arabic body')
  })

  it('Unpublish returns the article to draft', async () => {
    api.getArticle.mockResolvedValue(server({ status: 'PUBLISHED', publishedAt: '2026-11-05T00:00:00Z', linkToken: 'tok' }))
    api.unpublishArticle.mockResolvedValue(server({ status: 'DRAFT', linkToken: 'tok' }))
    open(5)

    fireEvent.click(await screen.findByRole('button', { name: 'Unpublish' }))

    expect(await screen.findByRole('button', { name: 'Publish' })).toBeTruthy()
    expect(api.unpublishArticle).toHaveBeenCalledWith('k', 5)
  })

  it('does not let a live article be saved with a blank field', async () => {
    api.getArticle.mockResolvedValue(server({ status: 'PUBLISHED', linkToken: 'tok' }))
    open(5)
    await screen.findByRole('button', { name: 'Unpublish' })

    type('الملخص', '')

    expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('hands a rejected key back to the app', async () => {
    const { AdminAuthError } = await import('../adminApi')
    api.createArticle.mockRejectedValue(new AdminAuthError())
    open()
    type('Title', 'x')

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(onAuthError).toHaveBeenCalled())
  })
})

describe('unsaved changes', () => {
  it('goes straight back when nothing changed', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /back to content/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('asks before leaving with unsaved changes, and can stay', () => {
    open()
    type('Title', 'draft text')

    fireEvent.click(screen.getByRole('button', { name: /back to content/i }))

    const dialog = screen.getByRole('dialog')
    expect(onBack).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /back to content/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Leave and discard' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('warns on tab close only while there are unsaved changes', () => {
    open()
    const closeEvent = () => {
      const e = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(closeEvent()).toBe(false)

    type('Title', 'x')

    expect(closeEvent()).toBe(true)
  })
})

describe('preview', () => {
  it('renders the article as visitors see it, with an English/Arabic toggle', () => {
    const { container } = open()
    fillEverything()
    type('Body (Markdown)', 'Some **bold** words')
    type('النص (Markdown)', 'كلمات **غامقة**')

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

    expect(screen.getByRole('heading', { level: 1, name: 'English title' })).toBeTruthy()
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    expect(container.querySelector('article')?.getAttribute('dir')).toBe('ltr')

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }))

    expect(screen.getByRole('heading', { level: 1, name: 'عنوان' })).toBeTruthy()
    expect(container.querySelector('strong')?.textContent).toBe('غامقة')
    expect(container.querySelector('article')?.getAttribute('dir')).toBe('rtl')
  })
})

describe('toolbar', () => {
  it('inserts bold markers around the selected text of that body only', () => {
    open()
    const body = screen.getByLabelText('Body (Markdown)') as HTMLTextAreaElement
    fireEvent.change(body, { target: { value: 'make this bold' } })
    body.setSelectionRange(5, 9)

    fireEvent.click(screen.getByRole('button', { name: 'Bold (English body)' }))

    expect(body.value).toBe('make **this** bold')
    expect((screen.getByLabelText('النص (Markdown)') as HTMLTextAreaElement).value).toBe('')
  })
})

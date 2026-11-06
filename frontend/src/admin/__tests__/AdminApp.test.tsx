import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminApp from '../AdminApp'

const api = vi.hoisted(() => ({
  listArticles: vi.fn(),
  listLinks: vi.fn(),
  deleteArticle: vi.fn(),
  resetLink: vi.fn(),
}))

vi.mock('../adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../adminApi')>()),
  ...api,
}))

import { AdminAuthError } from '../adminApi'

const pageLinks = ['home', 'journey', 'meeqat', 'boundaries'].map((key) => ({
  type: 'PAGE', key, token: `page-token-${key}`, createdAt: '2026-11-05T00:00:00Z',
}))

const articles = [
  { id: 1, titleEn: 'Live one', titleAr: 'مقال منشور', status: 'PUBLISHED', createdAt: '', updatedAt: '', publishedAt: '2026-11-05T00:00:00Z', linkToken: 'article-token-1' },
  { id: 2, titleEn: 'Draft one', titleAr: null, status: 'DRAFT', createdAt: '', updatedAt: '', publishedAt: null, linkToken: null },
]

beforeEach(() => {
  sessionStorage.clear()
  Object.values(api).forEach((f) => f.mockReset())
  api.listArticles.mockResolvedValue(articles)
  api.listLinks.mockResolvedValue(pageLinks)
})
afterEach(cleanup)

async function signIn(key = 'my-key') {
  render(<AdminApp />)
  fireEvent.change(screen.getByLabelText('Admin key'), { target: { value: key } })
  fireEvent.click(screen.getByRole('button', { name: 'Open admin' }))
  await screen.findByRole('heading', { name: 'Content and links' })
}

describe('admin key', () => {
  it('asks for the key first, and marks the page noindex', () => {
    render(<AdminApp />)
    expect(screen.getByLabelText('Admin key')).toBeTruthy()
    expect(api.listArticles).not.toHaveBeenCalled()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })

  it('keeps the key in sessionStorage only, and uses it for the requests', async () => {
    await signIn('my-key')

    expect(sessionStorage.getItem('adminKey')).toBe('my-key')
    expect(localStorage.getItem('adminKey')).toBeNull()
    expect(api.listArticles).toHaveBeenCalledWith('my-key')
    expect(api.listLinks).toHaveBeenCalledWith('my-key')
    expect(screen.getByText('Key active until tab closes')).toBeTruthy()
  })

  it('loads the list only once (admin requests are rate limited)', async () => {
    await signIn()
    expect(api.listArticles).toHaveBeenCalledTimes(1)
    expect(api.listLinks).toHaveBeenCalledTimes(1)
  })

  it('signs in straight away when the tab already has a key', async () => {
    sessionStorage.setItem('adminKey', 'stored')
    render(<AdminApp />)
    await screen.findByRole('heading', { name: 'Content and links' })
    expect(api.listArticles).toHaveBeenCalledWith('stored')
  })

  it('sign out clears the key and returns to the key screen', async () => {
    await signIn()

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(sessionStorage.getItem('adminKey')).toBeNull()
    expect(screen.getByLabelText('Admin key')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Content and links' })).toBeNull()
  })

  it('returns to the key screen with a message when the key is rejected', async () => {
    api.listArticles.mockRejectedValue(new AdminAuthError())
    render(<AdminApp />)
    fireEvent.change(screen.getByLabelText('Admin key'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Open admin' }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('not accepted')
    expect(sessionStorage.getItem('adminKey')).toBeNull()
    expect(screen.getByLabelText('Admin key')).toBeTruthy()
  })

  it('shows a retry (and keeps the key) when the server is unreachable', async () => {
    api.listArticles.mockRejectedValueOnce(new Error('network'))
    render(<AdminApp />)
    fireEvent.change(screen.getByLabelText('Admin key'), { target: { value: 'k' } })
    fireEvent.click(screen.getByRole('button', { name: 'Open admin' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    await screen.findByRole('heading', { name: 'Content and links' })
    expect(sessionStorage.getItem('adminKey')).toBe('k')
  })
})

describe('content and links', () => {
  it('lists pages and articles with filter counts', async () => {
    await signIn()

    expect(screen.getByRole('button', { name: 'All (6)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pages (4)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Articles (2)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Drafts (1)' })).toBeTruthy()
    expect(screen.getByText('/p/page-token-journey')).toBeTruthy()
    expect(screen.getByText('/p/article-token-1')).toBeTruthy()
    expect(screen.getByText('Made on publish')).toBeTruthy()
    expect(screen.getByText('الرئيسية')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Drafts (1)' }))
    expect(screen.getByText('Draft one')).toBeTruthy()
    expect(screen.queryByText('Live one')).toBeNull()
    expect(screen.queryByText('Home')).toBeNull()
  })

  it('copies the full link for a row', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await signIn()

    fireEvent.click(screen.getByRole('button', { name: 'Copy link for Live one' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/p/article-token-1`))
  })

  it('has no copy or reset for a draft that has no link yet', async () => {
    await signIn()
    expect((screen.getByRole('button', { name: 'Copy link for Draft one' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Reset link for Draft one' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('resets a link only after confirmation, and shows the new token', async () => {
    api.resetLink.mockResolvedValue({ type: 'PAGE', key: 'journey', token: 'brand-new-token', createdAt: '' })
    await signIn()

    fireEvent.click(screen.getByRole('button', { name: 'Reset link for The Journey' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('stop working')
    expect(api.resetLink).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Reset link' }))

    expect(await screen.findByText('/p/brand-new-token')).toBeTruthy()
    expect(api.resetLink).toHaveBeenCalledWith('my-key', 'PAGE', 'journey')
    expect(screen.queryByText('/p/page-token-journey')).toBeNull()
  })

  it('does nothing when the reset is cancelled', async () => {
    await signIn()
    fireEvent.click(screen.getByRole('button', { name: 'Reset link for Home' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(api.resetLink).not.toHaveBeenCalled()
  })

  it('deletes an article after confirmation and removes its row', async () => {
    api.deleteArticle.mockResolvedValue(undefined)
    await signIn()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Draft one' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete article' }))

    await waitFor(() => expect(screen.queryByText('Draft one')).toBeNull())
    expect(api.deleteArticle).toHaveBeenCalledWith('my-key', 2)
  })

  it('offers no edit or delete for pages', async () => {
    await signIn()
    expect(screen.queryByRole('button', { name: 'Edit Home' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete Home' })).toBeNull()
  })
})

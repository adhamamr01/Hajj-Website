import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArticlePage from '../ArticlePage'
import { I18nProvider } from '../../i18n/I18nProvider'

const api = vi.hoisted(() => ({ getArticle: vi.fn() }))
vi.mock('../../api/client', () => api)

const full = {
  id: 3,
  titleEn: 'English title',
  titleAr: 'العنوان العربي',
  summaryEn: 'English summary',
  summaryAr: 'الملخص العربي',
  bodyEn: 'English **body**',
  bodyAr: 'النص **العربي**',
  publishedAt: '2026-11-05T10:00:00Z',
}

function show(locale: 'en' | 'ar') {
  localStorage.setItem('locale', locale)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ArticlePage id="3" />
      </I18nProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => api.getArticle.mockReset())
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('ArticlePage language', () => {
  it('shows the English article for the English locale', async () => {
    api.getArticle.mockResolvedValue(full)
    const { container } = show('en')

    expect(await screen.findByRole('heading', { level: 1, name: 'English title' })).toBeTruthy()
    expect(screen.getByText('English summary')).toBeTruthy()
    expect(container.querySelector('article')?.getAttribute('dir')).toBe('ltr')
    expect(screen.getByText('Published 5 November 2026')).toBeTruthy()
    expect(document.title).toContain('English title')
  })

  it('shows the Arabic article, right-to-left, for the Arabic locale', async () => {
    api.getArticle.mockResolvedValue(full)
    const { container } = show('ar')

    expect(await screen.findByRole('heading', { level: 1, name: 'العنوان العربي' })).toBeTruthy()
    expect(screen.getByText('الملخص العربي')).toBeTruthy()
    expect(container.querySelector('article')?.getAttribute('dir')).toBe('rtl')
    expect(container.querySelector('.article-prose')?.parentElement?.getAttribute('dir')).toBe('rtl')
    expect(container.querySelector('strong')?.textContent).toBe('العربي')
    // Gregorian date with Latin digits
    expect(container.querySelector('time')?.textContent).toMatch(/5.*2026/)
    expect(document.title).toContain('العنوان العربي')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('الملخص العربي')
  })

  it('falls back to English per field, and keeps an English body left-to-right', async () => {
    api.getArticle.mockResolvedValue({ ...full, titleAr: '', summaryAr: '  ', bodyAr: '' })
    const { container } = show('ar')

    expect(await screen.findByRole('heading', { level: 1, name: 'English title' })).toBeTruthy()
    expect(screen.getByText('English summary')).toBeTruthy()
    expect(container.querySelector('.article-prose')?.parentElement?.getAttribute('dir')).toBe('ltr')
    expect(container.querySelector('strong')?.textContent).toBe('body')
  })

  it('shows the not-found page when the article does not exist', async () => {
    api.getArticle.mockResolvedValue(null)
    show('en')
    expect(await screen.findByText('Page Not Found')).toBeTruthy()
  })

  it('offers a retry when loading fails', async () => {
    api.getArticle.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(full)
    show('en')

    const retry = await screen.findByText('Retry')
    retry.click()
    expect(await screen.findByText('English title')).toBeTruthy()
  })
})

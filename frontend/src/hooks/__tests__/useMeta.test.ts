import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMeta } from '../useMeta'

describe('useMeta', () => {
  beforeEach(() => {
    document.title = ''
    // Remove any meta tags added by previous tests
    document.querySelectorAll('meta[property], meta[name]').forEach(el => el.remove())
  })

  it('sets document title with site suffix', () => {
    renderHook(() => useMeta({ title: 'The Journey of Hajj', description: 'desc' }))
    expect(document.title).toBe('The Journey of Hajj — Journey to Hajj')
  })

  it('uses site name alone when title matches site name', () => {
    renderHook(() => useMeta({ title: 'Journey to Hajj', description: 'desc' }))
    expect(document.title).toBe('Journey to Hajj')
  })

  it('sets og:title meta tag', () => {
    renderHook(() => useMeta({ title: 'Meeqat Points', description: 'desc' }))
    const og = document.querySelector('meta[property="og:title"]')
    expect(og?.getAttribute('content')).toBe('Meeqat Points — Journey to Hajj')
  })

  it('sets og:description meta tag', () => {
    const desc = 'Explore the five Meeqat stations.'
    renderHook(() => useMeta({ title: 'Meeqat Points', description: desc }))
    const og = document.querySelector('meta[property="og:description"]')
    expect(og?.getAttribute('content')).toBe(desc)
  })

  it('sets standard description meta tag', () => {
    const desc = 'Explore the five Meeqat stations.'
    renderHook(() => useMeta({ title: 'Meeqat Points', description: desc }))
    const meta = document.querySelector('meta[name="description"]')
    expect(meta?.getAttribute('content')).toBe(desc)
  })

  it('updates title when props change', () => {
    const { rerender } = renderHook(
      ({ title }) => useMeta({ title, description: 'desc' }),
      { initialProps: { title: 'Page A' } },
    )
    expect(document.title).toBe('Page A — Journey to Hajj')

    rerender({ title: 'Page B' })
    expect(document.title).toBe('Page B — Journey to Hajj')
  })
})

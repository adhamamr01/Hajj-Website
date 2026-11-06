import { render, renderHook, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ReactNode } from 'react'
import { I18nProvider, useTranslation } from '../I18nProvider'
import { pickLocalized } from '../pick'
import { translations } from '../translations'
import LanguageSwitch from '../../components/LanguageSwitch'

const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
    document.documentElement.dir = ''
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('defaults to English with ltr', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('en')
    expect(result.current.t('nav.home')).toBe(translations.en['nav.home'])
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('defaults to Arabic when the browser language is Arabic and nothing is stored', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ar-EG')
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('a stored choice wins over the browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ar')
    localStorage.setItem('locale', 'en')
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('en')
  })

  it('ignores an invalid stored value', () => {
    localStorage.setItem('locale', 'fr')
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('en')
  })

  it('setLocale switches strings, sets lang/dir and persists', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLocale('ar'))
    expect(result.current.locale).toBe('ar')
    expect(result.current.t('nav.home')).toBe(translations.ar['nav.home'])
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(localStorage.getItem('locale')).toBe('ar')

    act(() => result.current.setLocale('en'))
    expect(document.documentElement.dir).toBe('ltr')
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('still switches when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('en')
    act(() => result.current.setLocale('ar'))
    expect(result.current.locale).toBe('ar')
  })

  it('t fills {placeholders}', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.t('meeqatMap.imageAlt', { name: 'Yalamlam', n: 2 })).toBe('Yalamlam 2')
  })

  it('works without a provider (defaults to English)', () => {
    const { result } = renderHook(() => useTranslation())
    expect(result.current.locale).toBe('en')
    expect(result.current.t('site.name')).toBe('Journey to Hajj')
  })
})

describe('pick', () => {
  it('returns Arabic only for ar with a non-empty value', () => {
    expect(pickLocalized('ar', 'Name', 'اسم')).toBe('اسم')
    expect(pickLocalized('en', 'Name', 'اسم')).toBe('Name')
  })

  it('falls back to English when the Arabic value is missing or blank', () => {
    expect(pickLocalized('ar', 'Name', undefined)).toBe('Name')
    expect(pickLocalized('ar', 'Name', null)).toBe('Name')
    expect(pickLocalized('ar', 'Name', '')).toBe('Name')
    expect(pickLocalized('ar', 'Name', '   ')).toBe('Name')
  })

  it('is bound to the current locale via useTranslation', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.pick('Name', 'اسم')).toBe('Name')
    act(() => result.current.setLocale('ar'))
    expect(result.current.pick('Name', 'اسم')).toBe('اسم')
    expect(result.current.pick('Name', '')).toBe('Name')
    expect(result.current.pick(undefined, undefined)).toBe('')
  })
})

describe('LanguageSwitch', () => {
  beforeEach(() => localStorage.clear())

  it('shows the other language and toggles on click', () => {
    render(<I18nProvider><LanguageSwitch /></I18nProvider>)
    const button = screen.getByRole('button', { name: /switch language to arabic/i })
    expect(button.textContent).toBe('العربية')

    fireEvent.click(button)
    const back = screen.getByRole('button', { name: translations.ar['lang.switchLabel'] })
    expect(back.textContent).toBe('English')
    expect(document.documentElement.dir).toBe('rtl')
  })
})

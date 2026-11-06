import { describe, it, expect } from 'vitest'
import { translations } from '../translations'

describe('translations', () => {
  const enKeys = Object.keys(translations.en).sort()
  const arKeys = Object.keys(translations.ar).sort()

  it('en and ar define exactly the same keys', () => {
    expect(arKeys).toEqual(enKeys)
  })

  it.each(['en', 'ar'] as const)('%s has no empty strings', (locale) => {
    const empty = Object.entries(translations[locale]).filter(([, v]) => v.trim() === '')
    expect(empty).toEqual([])
  })

  it('ar and en use the same {placeholders} for every key', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const key of enKeys as (keyof typeof translations.en)[]) {
      expect(vars(translations.ar[key]), key).toEqual(vars(translations.en[key]))
    }
  })

  it('ar values contain Arabic script (except the intentionally Latin ones)', () => {
    const latinAllowed = new Set(['lang.switchText', 'meeqatMap.imageAlt'])
    const arabic = /[؀-ۿ]/
    for (const [key, value] of Object.entries(translations.ar)) {
      if (!latinAllowed.has(key)) expect(arabic.test(value), key).toBe(true)
    }
  })
})

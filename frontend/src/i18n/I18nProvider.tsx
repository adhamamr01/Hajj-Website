import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { translations, type Locale, type TranslationKey } from './translations'
import { pickLocalized } from './pick'

const STORAGE_KEY = 'locale'

type Vars = Record<string, string | number>

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Looks up a UI string; {placeholders} are filled from `vars`. */
  t: (key: TranslationKey, vars?: Vars) => string
  /** Picks the Arabic DB field when the locale is 'ar' and it is non-empty, else the English one. */
  pick: (en: string | undefined | null, ar: string | undefined | null) => string
}

function makeValue(locale: Locale, setLocale: (l: Locale) => void): I18nValue {
  return {
    locale,
    setLocale,
    t: (key, vars) => {
      const text = translations[locale][key]
      return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text
    },
    pick: (en, ar) => pickLocalized(locale, en ?? '', ar),
  }
}

// Default (no provider): English, so isolated components and hooks work in tests.
const I18nContext = createContext<I18nValue>(makeValue('en', () => {}))

/** Stored choice wins; otherwise Arabic if the browser language is Arabic; otherwise English. */
function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ar') return stored
  } catch {
    // storage unavailable (private mode, blocked) — fall through to detection
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  // Layout effect so lang/dir are set before first paint (no LTR flash for Arabic).
  useLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not persisted — the choice still applies for this session
    }
  }, [])

  const value = useMemo(() => makeValue(locale, setLocale), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation(): I18nValue {
  return useContext(I18nContext)
}

// Exposed for class components (error boundaries), which cannot use hooks.
export { I18nContext }

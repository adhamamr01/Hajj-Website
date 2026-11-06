import type { Locale } from './translations'

/**
 * Chooses between an English DB value and its Arabic counterpart.
 * Returns the Arabic value only when the locale is 'ar' and it is non-empty;
 * otherwise falls back to the English value.
 */
export function pickLocalized<T extends string | undefined | null>(
  locale: Locale,
  en: T,
  ar: string | undefined | null,
): T | string {
  return locale === 'ar' && ar && ar.trim() !== '' ? ar : en
}

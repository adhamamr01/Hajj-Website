import type { Locale } from '../i18n/translations'

/**
 * Long, localised date: en-GB ("5 November 2026") or Arabic month names with
 * Latin digits and the Gregorian calendar ("5 نوفمبر 2026"). Empty for a missing
 * or invalid date.
 */
export function formatDate(iso: string | undefined | null, locale: Locale): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const tag = locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB'
  return new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

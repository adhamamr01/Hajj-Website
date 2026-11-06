import { useEffect } from 'react'
import { useTranslation } from '../i18n/I18nProvider'

interface MetaOptions {
  title: string
  description: string
}

/**
 * Sets the document title and Open Graph meta tags for the current page.
 * Call at the top of every page component.
 */
export function useMeta({ title, description }: MetaOptions) {
  const { t } = useTranslation()
  const site = t('site.name')

  useEffect(() => {
    document.title = title === site ? site : `${title} — ${site}`

    // Open Graph
    setMeta('property', 'og:title',       document.title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type',        'website')

    // Twitter card
    setMeta('property', 'twitter:card',        'summary')
    setMeta('property', 'twitter:title',       document.title)
    setMeta('property', 'twitter:description', description)

    // Standard description
    setMeta('name', 'description', description)
  }, [title, description, site])
}

/** Creates or updates a <meta> element identified by the given attribute and key. */
function setMeta(attr: 'property' | 'name', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

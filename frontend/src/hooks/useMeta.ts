import { useEffect } from 'react'

interface MetaOptions {
  title: string
  description: string
}

const SITE = 'Journey to Hajj'

/**
 * Sets the document title and Open Graph meta tags for the current page.
 * Call at the top of every page component.
 */
export function useMeta({ title, description }: MetaOptions) {
  useEffect(() => {
    // Page title
    document.title = title === SITE ? SITE : `${title} — ${SITE}`

    // Open Graph
    setMeta('og:title', document.title)
    setMeta('og:description', description)
    setMeta('og:type', 'website')

    // Twitter card
    setMeta('twitter:card', 'summary')
    setMeta('twitter:title', document.title)
    setMeta('twitter:description', description)

    // Standard description
    setMetaName('description', description)
  }, [title, description])
}

function setMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

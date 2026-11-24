import ReactMarkdown from 'react-markdown'
import { IMAGE_BASE_URL } from '../config'

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:']

/**
 * Link filter for rendered Markdown: only http, https and mailto links (plus
 * relative and #anchor links) survive; anything else, such as javascript:, becomes
 * an empty URL. Whitespace and control characters are removed before checking
 * because browsers ignore them inside a scheme ("java\nscript:").
 */
export function safeUrl(url: string): string {
  const compact = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, '')
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(compact)
  if (!scheme) return url
  return SAFE_PROTOCOLS.includes(scheme[1].toLowerCase()) ? url : ''
}

/**
 * Whether `src` is an https address inside the image bucket (VITE_IMAGE_BASE_URL).
 * Compared after URL parsing, so "..", encoded dots and odd casing cannot escape the prefix.
 */
function isBucketImage(src: string | undefined): src is string {
  if (!IMAGE_BASE_URL || !src) return false
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && url.href.startsWith(IMAGE_BASE_URL)
  } catch {
    return false
  }
}

/**
 * Renders trusted-format Markdown. Raw HTML in the source is shown as plain text
 * (react-markdown escapes it; rehype-raw is deliberately NOT used). Images render
 * only from the image bucket; any other image renders nothing. External links open
 * in a new tab.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown
        urlTransform={safeUrl}
        components={{
          img: ({ src, alt }) =>
            isBucketImage(src) ? <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" /> : null,
          a: ({ href, children: label }) =>
            href && /^https?:/i.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ) : (
              <a href={href}>{label}</a>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Markdown, { safeUrl } from '../Markdown'

// IMAGE_BASE_URL is a build-time constant; the getter lets each test choose it.
const config = vi.hoisted(() => ({ imageBase: undefined as string | undefined }))
vi.mock('../../config', () => ({
  get IMAGE_BASE_URL() {
    return config.imageBase
  },
}))

const BUCKET = 'https://objectstorage.eu-test-1.oraclecloud.com/n/ns/b/bucket/o/'

afterEach(() => {
  cleanup()
  config.imageBase = undefined
})

const html = (md: string) => render(<Markdown>{md}</Markdown>).container

describe('Markdown rendering', () => {
  it('renders headings, emphasis and lists', () => {
    const c = html('## Title\n\nSome **bold** and *italic*\n\n- one\n- two')
    expect(c.querySelector('h2')?.textContent).toBe('Title')
    expect(c.querySelector('strong')?.textContent).toBe('bold')
    expect(c.querySelector('em')?.textContent).toBe('italic')
    expect(c.querySelectorAll('li')).toHaveLength(2)
  })

  it('does not turn raw HTML into elements (it is shown as text)', () => {
    const c = html('Hello <script>alert(1)</script> <img src=x onerror="alert(1)"> <b onclick="x()">hi</b>')
    expect(c.querySelector('script')).toBeNull()
    expect(c.querySelector('img')).toBeNull()
    expect(c.querySelector('b')).toBeNull()
    expect(c.querySelector('[onerror],[onclick]')).toBeNull()
    expect(c.textContent).toContain('<script>')
  })

  it('renders no images when no image bucket is configured', () => {
    expect(html(`![alt](${BUCKET}articles/a.webp)`).querySelector('img')).toBeNull()
    expect(html('![alt](https://example.com/a.png)').querySelector('img')).toBeNull()
  })

  it.each([
    '[x](javascript:alert(1))',
    '[x](JaVaScRiPt:alert(1))',
    '[x](data:text/html;base64,PHNjcmlwdD4=)',
    '[x](vbscript:msgbox)',
    '[x](&#106;avascript:alert(1))',
  ])('drops the unsafe link target in %s', (md) => {
    const a = html(md).querySelector('a')
    expect(a?.getAttribute('href') ?? '').toBe('')
  })

  it('opens http(s) links in a new tab with noopener noreferrer', () => {
    const a = html('[site](https://example.com/page)').querySelector('a')!
    expect(a.getAttribute('href')).toBe('https://example.com/page')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('keeps mailto links, without a new tab', () => {
    const a = html('[mail](mailto:a@example.com)').querySelector('a')!
    expect(a.getAttribute('href')).toBe('mailto:a@example.com')
    expect(a.getAttribute('target')).toBeNull()
  })
})

describe('Markdown images', () => {
  const bucketed = (md: string) => {
    config.imageBase = BUCKET
    return html(md)
  }

  it('renders a bucket image lazily, with its alt text and no fixed size', () => {
    const img = bucketed(`![The Kaaba at dawn](${BUCKET}articles/a.webp)`).querySelector('img')!
    expect(img.getAttribute('src')).toBe(`${BUCKET}articles/a.webp`)
    expect(img.getAttribute('alt')).toBe('The Kaaba at dawn')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
    expect(img.hasAttribute('width')).toBe(false)
    expect(img.hasAttribute('height')).toBe(false)
  })

  it('renders an image with empty alt text as decorative', () => {
    expect(bucketed(`![](${BUCKET}articles/a.webp)`).querySelector('img')!.getAttribute('alt')).toBe('')
  })

  it.each([
    ['another host', 'https://example.com/n/ns/b/bucket/o/a.png'],
    ['the bucket host but another bucket', 'https://objectstorage.eu-test-1.oraclecloud.com/n/ns/b/other/o/a.png'],
    ['a look-alike host', 'https://objectstorage.eu-test-1.oraclecloud.com.evil.example/n/ns/b/bucket/o/a.png'],
    ['credentials before the host', 'https://objectstorage.eu-test-1.oraclecloud.com@evil.example/n/ns/b/bucket/o/a.png'],
    ['a path that climbs out of the bucket', `${BUCKET}../../../b/other/o/a.png`],
    ['an encoded climb out of the bucket', `${BUCKET}%2e%2e/%2e%2e/%2e%2e/b/other/o/a.png`],
    ['plain http', BUCKET.replace('https:', 'http:') + 'a.png'],
    ['a data: address', 'data:image/png;base64,iVBORw0KGgo='],
    ['javascript:', 'javascript:alert(1)'],
    ['a relative address', '/images/a.png'],
  ])('drops an image from %s', (_name, src) => {
    expect(bucketed(`![x](${src})`).querySelector('img')).toBeNull()
  })

  it('still escapes raw HTML images', () => {
    expect(bucketed(`<img src="${BUCKET}a.png" onerror="alert(1)">`).querySelector('img')).toBeNull()
  })

  it('ignores a non-https bucket setting', () => {
    config.imageBase = undefined
    expect(html(`![x](${BUCKET}a.png)`).querySelector('img')).toBeNull()
  })
})

describe('safeUrl', () => {
  it.each(['http://a.b', 'https://a.b/c?d=e', 'mailto:x@y.z', '/relative', '#anchor', 'page.html'])('allows %s', (u) => {
    expect(safeUrl(u)).toBe(u)
  })

  it.each(['javascript:alert(1)', ' JAVASCRIPT:alert(1)', 'java\nscript:alert(1)', 'java\tscript:x', 'data:text/html,x', 'file:///etc/passwd', 'ftp://a.b'])(
    'blocks %j',
    (u) => {
      expect(safeUrl(u)).toBe('')
    },
  )
})

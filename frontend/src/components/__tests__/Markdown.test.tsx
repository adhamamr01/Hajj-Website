import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Markdown, { safeUrl } from '../Markdown'

afterEach(cleanup)

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

  it('does not render images at all', () => {
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

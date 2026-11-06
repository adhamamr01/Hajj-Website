import { describe, expect, it } from 'vitest'
import { applyMarkdown } from '../markdownTools'

describe('applyMarkdown', () => {
  it('wraps the selection in bold and keeps it selected', () => {
    const r = applyMarkdown('bold', 'say hello now', 4, 9)
    expect(r.value).toBe('say **hello** now')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('hello')
  })

  it('puts the cursor between the markers when nothing is selected', () => {
    const r = applyMarkdown('italic', 'ab', 1, 1)
    expect(r.value).toBe('a**b')
    expect(r.selectionStart).toBe(2)
  })

  it('turns the line into a heading', () => {
    const r = applyMarkdown('h2', 'intro\nmiddle line\nend', 8, 8)
    expect(r.value).toBe('intro\n## middle line\nend')
  })

  it('makes every selected line a list item', () => {
    const r = applyMarkdown('list', 'a\nb\nc', 0, 3)
    expect(r.value).toBe('- a\n- b\nc')
  })

  it('wraps a selection as a link and selects the URL placeholder', () => {
    const r = applyMarkdown('link', 'see docs', 4, 8)
    expect(r.value).toBe('see [docs](https://)')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('https://')
  })

  it('inserts a link with selected placeholder text when nothing is selected', () => {
    const r = applyMarkdown('link', '', 0, 0)
    expect(r.value).toBe('[link text](https://)')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('link text')
  })
})

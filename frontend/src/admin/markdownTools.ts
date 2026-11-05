export type MarkdownAction = 'bold' | 'italic' | 'h2' | 'list' | 'link'

export interface TextEdit {
  value: string
  selectionStart: number
  selectionEnd: number
}

/**
 * Inserts Markdown syntax into `value` around the selection [start, end).
 * Pure, so the textarea toolbar can be tested without a DOM.
 */
export function applyMarkdown(action: MarkdownAction, value: string, start: number, end: number): TextEdit {
  const selected = value.slice(start, end)

  if (action === 'bold' || action === 'italic') {
    const mark = action === 'bold' ? '**' : '*'
    const text = value.slice(0, start) + mark + selected + mark + value.slice(end)
    return { value: text, selectionStart: start + mark.length, selectionEnd: end + mark.length }
  }

  if (action === 'link') {
    const label = selected || 'link text'
    const url = 'https://'
    const text = value.slice(0, start) + `[${label}](${url})` + value.slice(end)
    // Select the URL placeholder when text was already chosen, otherwise the label.
    return selected
      ? { value: text, selectionStart: start + label.length + 3, selectionEnd: start + label.length + 3 + url.length }
      : { value: text, selectionStart: start + 1, selectionEnd: start + 1 + label.length }
  }

  // Line-based actions: act on every line the selection touches.
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', end)
  const lineEnd = nextBreak === -1 ? value.length : nextBreak
  const prefix = action === 'h2' ? '## ' : '- '
  const lines = value.slice(lineStart, lineEnd).split('\n')
  // A heading applies to the first line only; a list item to every selected line.
  const changed = (action === 'h2' ? lines.slice(0, 1) : lines).map((l) => prefix + l)
  const rest = action === 'h2' ? lines.slice(1) : []
  const block = [...changed, ...rest].join('\n')
  return {
    value: value.slice(0, lineStart) + block + value.slice(lineEnd),
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length * changed.length,
  }
}

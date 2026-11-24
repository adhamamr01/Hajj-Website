import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())
vi.mock('axios', () => ({ default: { create: () => ({ request }) } }))

import { uploadErrorMessage, uploadImage } from '../adminApi'

beforeEach(() => request.mockReset())

describe('uploadImage', () => {
  it('posts the raw image with its own content type and the admin key, and returns the url', async () => {
    request.mockResolvedValue({ data: { url: 'https://bucket.example/o/articles/a.webp' } })
    const image = new Blob(['x'], { type: 'image/webp' })

    const url = await uploadImage('secret', image)

    expect(url).toBe('https://bucket.example/o/articles/a.webp')
    expect(request).toHaveBeenCalledWith({
      method: 'post',
      url: '/admin/images',
      data: image,
      headers: { 'Content-Type': 'image/webp', 'X-Admin-Key': 'secret' },
    })
  })
})

describe('uploadErrorMessage', () => {
  it('explains an unconfigured server on 503', () => {
    expect(uploadErrorMessage({ response: { status: 503, data: { error: 'Image uploads are not configured' } } })).toBe(
      "Image uploads aren't set up on the server yet.",
    )
  })

  it.each([
    [413, 'The image is larger than 5 MB'],
    [400, 'Only JPEG, PNG and WebP images are accepted'],
    [502, 'The image could not be stored. Try again later.'],
  ])('shows the server message for %i', (status, error) => {
    expect(uploadErrorMessage({ response: { status, data: { error } } })).toBe(error)
  })

  it('shows the wait message on 429', () => {
    expect(uploadErrorMessage({ response: { status: 429 } })).toBe('Too many requests — wait a minute and try again.')
  })

  it('falls back to a generic message without a response', () => {
    expect(uploadErrorMessage(new Error('network'))).toContain('Something went wrong')
  })
})

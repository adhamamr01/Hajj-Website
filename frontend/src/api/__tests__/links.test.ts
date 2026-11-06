import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getJourneySteps, resolveLink, setPageToken, clearCache } from '../client'

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { create: () => ({ get: mockGet }) },
}))

beforeEach(() => {
  mockGet.mockReset()
  clearCache()
  setPageToken(null)
})

describe('page token header', () => {
  it('sends X-Page-Token on content requests once a token is set', async () => {
    mockGet.mockResolvedValue({ data: [] })
    setPageToken('abc123')

    await getJourneySteps()

    expect(mockGet).toHaveBeenCalledWith('/journey', { headers: { 'X-Page-Token': 'abc123' } })
  })

  it('sends no token header when none is set', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await getJourneySteps()

    expect(mockGet).toHaveBeenCalledWith('/journey', { headers: undefined })
  })

  it('does not reuse cached data across different tokens', async () => {
    mockGet.mockResolvedValue({ data: [] })

    setPageToken('token-a')
    await getJourneySteps()
    setPageToken('token-b')
    await getJourneySteps()

    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('retries after a 404 on content (not cached as success)', async () => {
    mockGet
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: [] })
    setPageToken('abc123')

    await expect(getJourneySteps()).rejects.toBeDefined()
    await expect(getJourneySteps()).resolves.toEqual([])
  })
})

describe('resolveLink', () => {
  it('returns the link target for a known token', async () => {
    mockGet.mockResolvedValue({ data: { type: 'PAGE', key: 'journey' } })

    await expect(resolveLink('abc')).resolves.toEqual({ type: 'PAGE', key: 'journey' })
    expect(mockGet).toHaveBeenCalledWith('/links/abc')
  })

  it('resolves to null on 404 and asks again next time (never cached)', async () => {
    mockGet.mockRejectedValue({ response: { status: 404 } })

    await expect(resolveLink('nope')).resolves.toBeNull()
    await expect(resolveLink('nope')).resolves.toBeNull()
    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('rejects on other failures so the UI can offer a retry', async () => {
    mockGet.mockRejectedValue({ response: { status: 500 } })
    await expect(resolveLink('abc')).rejects.toBeDefined()

    mockGet.mockRejectedValue(new Error('network'))
    await expect(resolveLink('abc')).rejects.toThrow('network')
  })

  it('url-encodes the token', async () => {
    mockGet.mockResolvedValue({ data: { type: 'PAGE', key: 'home' } })
    await resolveLink('a/b')
    expect(mockGet).toHaveBeenCalledWith('/links/a%2Fb')
  })
})

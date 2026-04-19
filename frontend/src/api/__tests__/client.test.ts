import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMeeqatPoints, clearCache } from '../client'

// vi.hoisted ensures mockGet is defined before vi.mock's factory runs,
// which itself is hoisted before any imports resolve.
const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { create: () => ({ get: mockGet }) },
}))

beforeEach(() => {
  mockGet.mockReset()
  clearCache()
})

describe('client cache', () => {
  it('calls the network only once for repeated calls', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await getMeeqatPoints()
    await getMeeqatPoints()
    await getMeeqatPoints()

    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('re-fetches after a failed call so retry works', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ data: [] })

    await expect(getMeeqatPoints()).rejects.toThrow('network error')
    await expect(getMeeqatPoints()).resolves.toEqual([])

    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent in-flight requests', async () => {
    mockGet.mockResolvedValue({ data: [] })

    await Promise.all([getMeeqatPoints(), getMeeqatPoints(), getMeeqatPoints()])

    expect(mockGet).toHaveBeenCalledTimes(1)
  })
})

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useApi } from '../useApi'

describe('useApi', () => {
  it('starts in loading state', () => {
    const fn = vi.fn(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useApi(fn, 'error'))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets data on success', async () => {
    const fn = vi.fn(() => Promise.resolve(['a', 'b']))
    const { result } = renderHook(() => useApi(fn, 'error'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(['a', 'b'])
    expect(result.current.error).toBeNull()
  })

  it('sets error message on failure', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('network')))
    const { result } = renderHook(() => useApi(fn, 'Custom error message'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Custom error message')
  })

  it('clears error and re-fetches on retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(['ok'])

    const { result } = renderHook(() => useApi(fn, 'error'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('error')

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(['ok'])
    expect(result.current.error).toBeNull()
  })

  it('calls the fetch function exactly once on mount', async () => {
    const fn = vi.fn(() => Promise.resolve([]))
    renderHook(() => useApi(fn, 'error'))

    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1))
  })
})

import { describe, it, expect } from 'vitest'
import { requireArray } from '../array'

describe('requireArray', () => {
  it('returns the same array when given a valid array', () => {
    const data = [1, 2, 3]
    expect(requireArray(data, '/test')).toBe(data)
  })

  it('returns an empty array without throwing', () => {
    expect(requireArray([], '/test')).toEqual([])
  })

  it('throws when given a string', () => {
    expect(() => requireArray('not an array', '/test')).toThrow()
  })

  it('throws when given null', () => {
    expect(() => requireArray(null, '/test')).toThrow()
  })

  it('throws when given a plain object', () => {
    expect(() => requireArray({ data: [] }, '/test')).toThrow()
  })

  it('throws when given a number', () => {
    expect(() => requireArray(42, '/test')).toThrow()
  })

  it('error message includes the endpoint name', () => {
    expect(() => requireArray('bad', '/api/meeqat')).toThrow('/api/meeqat')
  })

  it('error message includes the actual type received', () => {
    expect(() => requireArray('bad', '/test')).toThrow('string')
  })
})

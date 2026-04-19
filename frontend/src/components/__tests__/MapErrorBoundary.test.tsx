import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import MapErrorBoundary from '../MapErrorBoundary'

// A component that throws on first render, then works after reset
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Leaflet exploded')
  return <div>Map rendered</div>
}

describe('MapErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <MapErrorBoundary>
        <Bomb shouldThrow={false} />
      </MapErrorBoundary>,
    )
    expect(screen.getByText('Map rendered')).toBeDefined()
  })

  it('renders fallback UI when a child throws', () => {
    // Suppress React's console.error for expected errors in tests
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MapErrorBoundary>
        <Bomb shouldThrow={true} />
      </MapErrorBoundary>,
    )

    expect(screen.getByText(/map encountered an error/i)).toBeDefined()
    expect(screen.getByText(/Leaflet exploded/i)).toBeDefined()
    spy.mockRestore()
  })

  it('shows a Try again button in the fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MapErrorBoundary>
        <Bomb shouldThrow={true} />
      </MapErrorBoundary>,
    )

    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined()
    spy.mockRestore()
  })

  it('resets to children after clicking Try again', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Wrapper owns the "armed" state so we can disarm before the boundary resets
    function Wrapper() {
      const [armed, setArmed] = React.useState(true)
      return (
        <div>
          <button onClick={() => setArmed(false)}>Disarm</button>
          <MapErrorBoundary>
            <Bomb shouldThrow={armed} />
          </MapErrorBoundary>
        </div>
      )
    }

    render(<Wrapper />)

    // Boundary is now showing the fallback
    expect(screen.getByText(/map encountered an error/i)).toBeDefined()

    // Disarm the bomb first, then reset the boundary
    fireEvent.click(screen.getByRole('button', { name: /disarm/i }))
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Map rendered')).toBeDefined()
    spy.mockRestore()
  })
})

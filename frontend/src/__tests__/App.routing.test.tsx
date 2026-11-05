import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// The flag is read at render time, so one file can cover both modes.
const flags = vi.hoisted(() => ({ linkOnly: true }))
vi.mock('../config', () => ({
  get LINK_ONLY() {
    return flags.linkOnly
  },
}))

const api = vi.hoisted(() => ({ resolveLink: vi.fn(), setPageToken: vi.fn() }))
vi.mock('../api/client', () => api)

// Page bodies are covered elsewhere (and Leaflet does not run in jsdom) — use markers.
vi.mock('../pages/Home', () => ({ default: () => <div>HOME PAGE</div> }))
vi.mock('../pages/Journey', () => ({ default: () => <div>JOURNEY PAGE</div> }))
vi.mock('../pages/MapRoute', () => ({ default: () => <div>MEEQAT PAGE</div> }))
vi.mock('../pages/MapSites', () => ({ default: () => <div>BOUNDARIES PAGE</div> }))

const sendBeacon = vi.fn()

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

/** Everything the analytics beacon was asked to record. */
async function beaconPages(): Promise<string[]> {
  return Promise.all(
    sendBeacon.mock.calls.map(
      ([, blob]) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader() // jsdom's Blob has no .text()
          reader.onload = () => resolve(JSON.parse(reader.result as string).page)
          reader.readAsText(blob as Blob)
        }),
    ),
  )
}

beforeEach(() => {
  flags.linkOnly = true
  api.resolveLink.mockReset()
  api.setPageToken.mockReset()
  sendBeacon.mockReset()
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
})

afterEach(cleanup)

describe('link-only mode on', () => {
  it('renders the page for a valid token, keeps the URL, and registers the token', async () => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key: 'journey' })

    visit('/p/secret-token')

    expect(await screen.findByText('JOURNEY PAGE')).toBeTruthy()
    expect(window.location.pathname).toBe('/p/secret-token')
    expect(api.resolveLink).toHaveBeenCalledWith('secret-token')
    expect(api.setPageToken).toHaveBeenCalledWith('secret-token')
  })

  it.each([
    ['home', 'HOME PAGE'],
    ['meeqat', 'MEEQAT PAGE'],
    ['boundaries', 'BOUNDARIES PAGE'],
  ])('maps page key %s to its page', async (key, marker) => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key })
    visit('/p/t')
    expect(await screen.findByText(marker)).toBeTruthy()
  })

  it('shows NotAvailable for an unknown token (and sends no token to the client)', async () => {
    api.resolveLink.mockResolvedValue(null)

    visit('/p/wrong')

    expect(await screen.findByText("This page isn't available")).toBeTruthy()
    expect(api.setPageToken).not.toHaveBeenCalled()
  })

  it.each(['/', '/journey', '/map-route', '/map-sites', '/p', '/anything/else'])(
    'shows NotAvailable at %s without asking the backend',
    async (path) => {
      visit(path)

      expect(await screen.findByText("This page isn't available")).toBeTruthy()
      expect(api.resolveLink).not.toHaveBeenCalled()
    },
  )

  it('offers a retry (not NotAvailable) when the lookup fails for another reason', async () => {
    api.resolveLink.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ type: 'PAGE', key: 'home' })

    visit('/p/t')

    const retry = await screen.findByText('Retry')
    expect(screen.queryByText("This page isn't available")).toBeNull()
    fireEvent.click(retry)
    expect(await screen.findByText('HOME PAGE')).toBeTruthy()
  })

  it('has no links anywhere on the NotAvailable screen or in the navbar', async () => {
    const { container } = visit('/journey')
    await screen.findByText("This page isn't available")

    expect(container.querySelectorAll('a')).toHaveLength(0)
    // brand is plain text, the language switch is still there
    expect(container.querySelector('nav')?.textContent).toContain('Journey to Hajj')
    expect(screen.getByRole('button', { name: /switch language/i })).toBeTruthy()
  })

  it('has no page links in the navbar of a resolved page', async () => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key: 'home' })
    const { container } = visit('/p/t')
    await screen.findByText('HOME PAGE')

    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(screen.queryByText('The Journey')).toBeNull()
  })

  it('never records the secret token in analytics', async () => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key: 'journey' })
    visit('/p/secret-token')
    await screen.findByText('JOURNEY PAGE')

    await waitFor(async () => expect(await beaconPages()).toContain('journey'))
    expect((await beaconPages()).join(' ')).not.toContain('secret-token')
  })

  it('records unavailable addresses as "unavailable", not their path', async () => {
    visit('/journey')
    await screen.findByText("This page isn't available")

    await waitFor(async () => expect(await beaconPages()).toEqual(['unavailable']))
  })
})

describe('link-only mode off', () => {
  beforeEach(() => {
    flags.linkOnly = false
  })

  it('forwards a valid token to the readable URL', async () => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key: 'journey' })

    visit('/p/secret-token')

    expect(await screen.findByText('JOURNEY PAGE')).toBeTruthy()
    expect(window.location.pathname).toBe('/journey')
    expect(api.setPageToken).not.toHaveBeenCalled()
  })

  it.each([
    ['home', '/'],
    ['meeqat', '/map-route'],
    ['boundaries', '/map-sites'],
  ])('forwards page key %s to %s', async (key, path) => {
    api.resolveLink.mockResolvedValue({ type: 'PAGE', key })
    visit('/p/t')
    await waitFor(() => expect(window.location.pathname).toBe(path))
  })

  it('shows the normal NotFound page for an unknown token', async () => {
    api.resolveLink.mockResolvedValue(null)
    visit('/p/wrong')
    expect(await screen.findByText('Page Not Found')).toBeTruthy()
  })

  it('serves the readable routes and keeps the navbar links', async () => {
    const { container } = visit('/journey')

    expect(await screen.findByText('JOURNEY PAGE')).toBeTruthy()
    expect(container.querySelectorAll('nav a').length).toBeGreaterThan(1)
    expect(api.resolveLink).not.toHaveBeenCalled()
  })
})

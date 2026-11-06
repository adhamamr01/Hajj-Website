import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Pre-launch "link-only" build (VITE_LINK_ONLY=true): put noindex in the HTML
 * itself and emit a disallow-all robots.txt, for crawlers that don't run JS.
 * Without the flag the build is unchanged.
 */
function linkOnlyRobots(enabled: boolean): Plugin {
  return {
    name: 'link-only-robots',
    transformIndexHtml: () =>
      enabled ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }] : [],
    generateBundle() {
      if (enabled) this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n' })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), linkOnlyRobots(loadEnv(mode, '.', 'VITE_').VITE_LINK_ONLY === 'true')],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}))

/**
 * Pre-launch "link-only" switch (build time). When VITE_LINK_ONLY is 'true',
 * pages open only through secret /p/:token links, there is no navigation
 * between pages, and every other address shows the "not available" screen.
 * Pair it with SITE_LINK_ONLY on the backend, which enforces it server-side.
 * To launch, turn both off and rebuild/redeploy.
 */
export const LINK_ONLY = import.meta.env.VITE_LINK_ONLY === 'true'

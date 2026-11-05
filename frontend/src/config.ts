/**
 * Pre-launch "link-only" switch (build time). When VITE_LINK_ONLY is 'true',
 * pages open only through secret /p/:token links, there is no navigation
 * between pages, and every other address shows the "not available" screen.
 * Pair it with SITE_LINK_ONLY on the backend, which enforces it server-side.
 * To launch, turn both off and rebuild/redeploy.
 */
export const LINK_ONLY = import.meta.env.VITE_LINK_ONLY === 'true'

/**
 * Secret address of the admin tool (build time). When VITE_ADMIN_PATH is set to
 * e.g. "k7x2m9", the tool lives at /k7x2m9; when unset there is no admin route at
 * all. It is only obscurity: the tool still needs the admin key, and the path is
 * visible in the built JavaScript.
 */
export const ADMIN_PATH: string | undefined = (import.meta.env.VITE_ADMIN_PATH ?? '').trim().replace(/^\/+|\/+$/g, '') || undefined

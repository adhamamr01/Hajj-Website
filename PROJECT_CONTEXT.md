# Project Context

## What this is
An educational website about the Islamic pilgrimage of Hajj. Four pages:
- **Home** — hero + entry cards + stats
- **The Journey** — step-by-step narrative of the pilgrimage rites
- **Meeqat Points** — interactive Leaflet map of the 5 Ihram stations
- **Sacred Boundaries** — interactive Leaflet map of the Haram boundary polygon

Live: frontend on Netlify, backend + PostgreSQL self-hosted via Docker on an Oracle Cloud Always Free VM.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5, Tailwind CSS 3, React Router v6, Leaflet / react-leaflet |
| Backend | Spring Boot 4.0.5, Java 25, Spring Data JPA, Flyway 11, Caffeine cache |
| Database | PostgreSQL 16 |
| CI | GitHub Actions — backend (Java 25 Temurin + Postgres 16 service container), frontend (Node 24, Vitest) |

---

## Key constraints

**No Lombok on JPA entities.** Lombok's annotation processing silently fails on Java 25 for `@Data`, `@RequiredArgsConstructor`, etc. — Jackson cannot find getters and omits fields from JSON responses. All 4 entity classes (`BoundaryPoint`, `HaramBoundary`, `JourneyStep`, `MeeqatPoint`) and all services use explicit constructors and getters/setters. Do not re-introduce Lombok on entities or Spring beans.

**Flyway manages all schema changes.** Never use `ddl-auto=create` or `ddl-auto=update` in production. New migrations go in `backend/src/main/resources/db/migration/` as `V{n}__description.sql`. The full schema lives in a single `V1__create_and_seed.sql` — do not edit it once deployed, add a new `V2__...` for any future changes. `V2__drop_api_config.sql` drops the now-unused `api_config` table.

**Rate limiting is hardcoded in `RateLimitFilter`.** `RATE_LIMITS` is a `Map<String, Integer>` in the filter class — path prefix → max requests per minute. Current limits: 20 req/min for public endpoints (including `/api/links` and `/api/articles`), 30 req/min for `/api/admin`, 60 req/min for `/api/analytics`. To add a new endpoint, add an entry to the map. The filter rejects any unregistered `/api/*` path with 404.

**Admin endpoints require `X-Admin-Key` header.** The key is set via the `ADMIN_API_KEY` environment variable. Default for local dev: `dev-admin-key` (set in root `.env`). Production key set in the `.env` file on the Oracle Cloud VM (not committed, read by `docker-compose.prod.yml`). Auth is checked manually in each admin controller — do not replace this with Spring Security roles, it is intentionally simple for a single-admin setup.

**Frontend API base URL** is baked in at build time via `VITE_API_BASE_URL`. Set on Netlify for production. In local dev, Vite proxies `/api/*` to `http://localhost:8080`.

**Link-only mode is one switch per side.** Backend `SITE_LINK_ONLY` (`site.link-only`, default `false`) and frontend build-time `VITE_LINK_ONLY` (default off, read only in `frontend/src/config.ts`). See "Link-only mode" below. Keep the two in step — turning only one on leaves the site half-gated.

---

## Database tables

| Table | Purpose |
|---|---|
| `meeqat_point` | Five fixed Ihram stations. VARCHAR slug PK (e.g. `dhul-hulayfah`) — intentional, dataset is static |
| `meeqat_images` | Gallery images per Meeqat point. No PK — managed as JPA `@ElementCollection` |
| `journey_step` | Seven Hajj pilgrimage steps shown as a timeline. Editable via admin API |
| `haram_boundary` | Named sacred boundaries drawn as circles on the map (center + radius) |
| `boundary_point` | Polygon vertices for the Haram boundary overlay, ordered by `order_index` |
| `page_link` | Secret link tokens (`/p/{token}`) for link-only mode. One active (`revoked_at IS NULL`) row per `(target_type, target_key)`, enforced by a partial unique index. Tokens are generated at startup, never in migrations (`V4__create_page_link.sql`) |
| `article` | Bilingual articles (`title/summary/body` in `_en` and `_ar`, bodies are Markdown), `status` DRAFT or PUBLISHED. Text columns are nullable so drafts can be partial (`V5__create_article.sql`) |
| `page_view` | Raw page-view events for analytics. `session_id` from sessionStorage for privacy-friendly unique visitor counts |

Schema documentation is stored in the database itself via `COMMENT ON TABLE / COLUMN`.

---

## Features

### Page analytics
- Frontend: `Analytics.tsx` (render-less component inside `BrowserRouter`) POSTs to `${VITE_API_BASE_URL}/analytics/view` with `fetch` (`keepalive`, `credentials: 'omit'`) on every route change. Not `sendBeacon`: it always sends credentials, so a cross-origin JSON beacon fails the CORS preflight. Uses `sessionStorage` UUID as session ID — resets on tab close, no personal data stored.
- Backend: `POST /api/analytics/view` (public) → `AnalyticsService` → `page_view` table.
- Admin queries: `GET /api/admin/analytics/summary?days=N` and `/trend?days=N` (both require `X-Admin-Key`). `days=0` means all-time.

### Editable content
- `PUT /api/admin/content/journey/{id}` — updates a journey step (title, description, border/title colours). Null fields are ignored (partial update).
- `PUT /api/admin/content/meeqat/{id}` — updates a Meeqat point's display fields. Lat/lng are excluded (coordinates are fixed).
- Both endpoints evict the relevant Caffeine cache (`@CacheEvict(allEntries=true)`) and are `@Transactional`.

### Link-only mode (pre-launch secret links)
While pre-launch, visitors open a page only through an unguessable link the owner shares (`https://<site>/p/<token>`). There is no navigation between pages, and any other address shows a "This page isn't available" screen. Enforced on the server, not just hidden in the UI.

- **Switches:** backend `SITE_LINK_ONLY=true` (set in `docker-compose.prod.yml`; local `docker-compose.yml` passes it through, default `false`) and frontend `VITE_LINK_ONLY=true` (set in the Netlify environment, build time).
- **Page keys:** `home` (`/`), `journey` (`/journey`), `meeqat` (`/map-route`), `boundaries` (`/map-sites`). Published articles use `target_type = ARTICLE` with `target_key` = the article id (see Articles).
- **Tokens:** `PageLinkInitializer` (ApplicationRunner) creates any missing active link on startup — 128 bits from `SecureRandom`, base64url, 22 chars. Tokens live only in the DB.
- **`GET /api/links/{token}`** (public, 20/min) → `{"type":"PAGE","key":"journey"}` or 404 (unknown and revoked look identical). Works in both modes; with link-only off the frontend uses it to forward old `/p/{token}` links to the readable URL.
- **Gating** (`LinkOnlyInterceptor`, only when link-only is on): `/api/journey`, `/api/meeqat/**`, `/api/boundary/**` require an `X-Page-Token` header whose active link is the page that uses that data (journey→journey, meeqat→meeqat, boundaries→boundary; the home page fetches no data). Otherwise 404. Default-deny for any other `/api/**` path except `/api/links`, `/api/analytics`, `/api/admin`. Also adds `X-Robots-Tag: noindex, nofollow`.
- **Admin:** `GET /api/admin/links` lists active links (pages and articles); `POST /api/admin/links/{PAGE|ARTICLE}/{key}/reset` revokes the old link and returns a new one (404 for an unknown page key, or an unknown/unpublished/non-numeric article id). Both need `X-Admin-Key`.
- **Frontend:** with the switch on, only `/p/:token` (resolved by `TokenPage`, URL stays `/p/token`) and the NotAvailable screen exist; Navbar shows the brand (not a link) and the language switch; Home hides the entry cards; the build adds `<meta name="robots" content="noindex, nofollow">` and a disallow-all `robots.txt` (`vite.config.ts` plugin). Analytics records the page key (or `unavailable`), never the token. The API client sends `X-Page-Token` on content requests and keys its cache by token.
- **Getting the links** (placeholder key — use the real `ADMIN_API_KEY`):
  ```bash
  curl -s https://80-225-76-113.sslip.io/api/admin/links -H "X-Admin-Key: <ADMIN_API_KEY>"
  # → [{"type":"PAGE","key":"journey","token":"...","createdAt":"..."}, ...]   share https://hajj-guide-website.netlify.app/p/<token>
  curl -s -X POST https://80-225-76-113.sslip.io/api/admin/links/PAGE/journey/reset -H "X-Admin-Key: <ADMIN_API_KEY>"
  ```
- **Launching:** set `SITE_LINK_ONLY` to `false` in `docker-compose.prod.yml` and redeploy the backend; remove `VITE_LINK_ONLY` (or set it to anything but `true`) on Netlify and redeploy the frontend. Previously shared `/p/<token>` links then forward to the readable URLs.

### Articles (bilingual, Markdown)
Articles are written in the admin tool in English and Arabic. A published article is public at `/articles/{id}` (normal mode) or through its secret link (link-only mode); a list lives at `/articles` in normal mode only.

- **Admin API** (all need `X-Admin-Key`, counted in the 30/min `/api/admin` budget): `GET /api/admin/articles` (list, no bodies, includes each article's active `linkToken`), `GET /api/admin/articles/{id}`, `POST /api/admin/articles` (create a draft, all fields optional), `PUT /api/admin/articles/{id}` (partial: null = ignore), `DELETE` (also revokes its link), `POST .../{id}/publish`, `POST .../{id}/unpublish`. Limits: title 200, summary 500, body 100,000 characters (400 beyond that).
- **Publishing** returns 400 listing every missing field unless title, summary and body are non-blank in BOTH languages ("Cannot publish: missing Arabic summary, ..."). It sets `status=PUBLISHED`, `published_at` (first publish only; unpublish keeps it, so a republished article keeps its date), and creates an `ARTICLE` `page_link` (key = article id) if none is active. **Unpublish** goes back to DRAFT and keeps the link, so republishing reuses the same URL; a kept link on a draft resolves but its content is 404.
- **Public API:** `GET /api/articles` (published list: id, titles, summaries, `publishedAt`; 20/min) and `GET /api/articles/{id}` (full, both languages; 404 for drafts, unknown and non-numeric ids). Neither exposes status or tokens. Both are Caffeine-cached (`articleList`, `article`) and every admin write evicts both.
- **Link-only mode:** `/api/articles/{id}` needs an `X-Page-Token` whose active link is `ARTICLE` with that id (another article's token, a page token, or none gives 404); `/api/articles` is always 404. Implemented in `LinkOnlyInterceptor.grants()`.
- **Frontend:** `ArticleView` renders title, summary, date and body (shared by `ArticlePage` and the admin preview); language comes from the i18n locale via `pick()` rules (Arabic falls back to English per field; an English fallback body stays left-to-right). Dates: `en-GB` / `ar-SA` with the Gregorian calendar and Latin digits. Routes: `/articles`, `/articles/:id` (normal mode), or `/p/:token` resolving to an ARTICLE (both modes). The navbar has an "Articles" link in normal mode only. Analytics records `article:<id>`, never a token.
- **Markdown** is rendered by `react-markdown` (`components/Markdown.tsx`). Raw HTML is escaped (never add `rehype-raw`), images are not rendered yet, and only `http`, `https`, `mailto` (plus relative/`#` links) survive `urlTransform`; external links open in a new tab with `rel="noopener noreferrer"`. Typography is the `.article-prose` class in `index.css`.

### Admin tool (articles and links)
A small English-only web UI for the owner, served by the frontend at a secret address. Lazy-loaded (separate JS chunk), always `noindex, nofollow`, works in both normal and link-only mode, and has no navbar/analytics.

- **Enable:** set build-time `VITE_ADMIN_PATH` to a random string (e.g. in Netlify env vars), redeploy, then open `https://<site>/<VITE_ADMIN_PATH>`. Unset = no admin route at all (the address is just another unknown page). Local: `VITE_ADMIN_PATH=dev-admin-ui npm run dev`. The path is only obscurity (it is visible in the built JS); the `ADMIN_API_KEY` is the real protection.
- **Sign-in:** enter the `ADMIN_API_KEY`. It is kept in `sessionStorage` only (gone when the tab closes); "Sign out" clears it, and a 401/403 from the API returns to the key screen with a message.
- **Content and links:** pages (home, journey, meeqat, boundaries) and articles with status, secret link, copy link (full `https://<site>/p/<token>`), reset link (confirm; the old link stops working), and for articles edit and delete. Filter chips All / Pages / Articles / Drafts.
- **Editor:** English and Arabic side by side with a Markdown toolbar (bold, italic, heading, list, link; the photo button is disabled because images are not supported yet). Amber pills name missing required fields and Publish stays disabled until all six are filled; a live article cannot be saved with a blank field. Preview shows the article as visitors see it with an EN/AR toggle. Leaving with unsaved changes asks first.
- **Request budget:** the UI loads the list and links once (2 requests) and updates from save responses; opening an article is 1 request, Save 1, Publish 1-2. This fits comfortably in the 30/min admin limit; if it is ever hit, the UI says to wait a minute.

### Spring Security
- `SecurityConfig.java` — CSRF disabled, stateless sessions, `/api/**` permitted, everything else denied (`denyAll()`).
- Actuator configured to only expose `/actuator/health` with `show-details=never`. Security is defence-in-depth in case exposure config is accidentally widened.

---

## Local development

```bash
# Start database + backend
docker compose up -d

# Start frontend dev server (from frontend/)
npm run dev
```

Backend runs on `:8080`, frontend dev server on `:5173` (proxies `/api` to backend).

---

## Deployment

| Service | URL | Trigger | Config |
|---|---|---|---|
| Netlify (frontend) | `https://hajj-guide-website.netlify.app` | Push to `main` (auto-deploys) | `netlify.toml` — build: `cd frontend && npm install && npm run build` |
| Oracle Cloud VM (backend + Postgres) | `https://80-225-76-113.sslip.io` | Manual — see below | `docker-compose.prod.yml`, `Caddyfile` |

**Infrastructure:** a single Always Free `VM.Standard.A1.Flex` instance (4 OCPU / 24GB, Ubuntu 24.04) named `hajj-website-backend`, on its own VCN (`hajj-website-vcn`) with a reserved public IP (`80.225.76.113`, so it survives reboots). Everything runs as Docker containers on this one VM: Postgres 16, the Spring Boot backend, and Caddy as a reverse proxy providing free automatic HTTPS via a `sslip.io` hostname (no domain purchase needed — `sslip.io` resolves `<ip-with-dashes>.sslip.io` to that IP with zero signup).

**Deploying a backend change is manual** (unlike the frontend, which auto-deploys on push): SSH into the VM, then:
```bash
cd Hajj-Website
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**No uptime-ping workaround needed.** Unlike Render's free tier, an Always Free compute instance doesn't sleep after inactivity — there is deliberately no UptimeRobot (or equivalent) monitor.

**Environment variables required on the VM** — set in a `.env` file in the repo root on the VM (never committed; `docker-compose.prod.yml` reads them):
- `DB_PASSWORD` — Postgres password (also used as `SPRING_DATASOURCE_PASSWORD`)
- `ADMIN_API_KEY` — secret key for `/api/admin/*` endpoints

(`SPRING_PROFILES_ACTIVE=prod` and the DB URL/username are hardcoded in `docker-compose.prod.yml` itself, not env-configured.)

**Keeping this genuinely free:** stick to Always Free-eligible shapes only (this VM already uses the full 4 OCPU/24GB Ampere A1 allowance), don't enable OCI's paid Boot Volume Backup policy (back up the DB yourself via `pg_dump`, e.g. to OCI Object Storage's own Always Free 20GB tier), and don't upgrade the tenancy to Pay-As-You-Go.

---

## Design system

Sanctuary Green theme (from Claude Design). Key tokens:
- Primary: `#1a5f3f` (dark green), light: `#2a7f5f`, dark: `#0f3d27`
- Secondary / accent: `#d4af37` (gold) — only on green backgrounds
- Hero gradient: `linear-gradient(135deg, #0f3d27 0%, #1a5f3f 55%, #2a7f5f 100%)`
- Display font: Cormorant Garamond (italic, weight 600) for all `h1`/`h2` and brand name
- Body font: Inter

**Tone:** reverent, scholarly, hospitable. No marketing language. Arabic transliterations follow the spellings already in the DB seed data.

---

## Test coverage

| Layer | File | What it tests |
|---|---|---|
| Backend | `ApiIntegrationTest` | Full-stack: Security → RateLimitFilter → Controller (12 tests) |
| Backend | `PageLinkIntegrationTest` | Link resolution, admin list/reset, nothing gated when link-only is off (uses a fresh fake client IP per request, so it doesn't touch the shared rate-limit budget) |
| Backend | `LinkOnlyIntegrationTest` | Link-only gating: no/wrong/other-page/revoked token → 404, right token → 200, noindex header, CORS preflight (own context with `site.link-only=true`) |
| Backend | `ArticleIntegrationTest` | Article admin CRUD, partial update, length validation, publish rules (missing Arabic gives 400), link creation, unpublish keeps link, delete revokes it, link reset, public list/get, cache eviction (cleans up its own articles) |
| Backend | `ArticleLinkOnlyIntegrationTest` | Article gating in link-only mode: own token 200, another article's / a page's / no token 404, list 404, unpublished 404, admin reachable |
| Backend | `JourneyServiceTest` | `findAllOrdered()` delegation and ordering |
| Backend | `MeeqatServiceTest` | `findAll()`, `findById()`, 404 case |
| Backend | `BoundaryServiceTest` | `findAllBoundaries()`, `findAllBoundaryPoints()` |
| Frontend | `client.test.ts` | API client cache — deduplication, retry after failure, single network call |
| Frontend | `array.test.ts` | `requireArray` utility |
| Frontend | `useMeta.test.ts` | Document title and meta tag updates |
| Frontend | `useApi.test.ts` | Loading / error / retry state transitions |
| Frontend | `App.routing.test.tsx` | Routing in both modes (token page, NotAvailable, forwarding, no nav links, analytics never records the token), ARTICLE links and article routes, admin route present only when `VITE_ADMIN_PATH` is set |
| Frontend | `links.test.ts` | `X-Page-Token` header, cache per token, `resolveLink` 404/other errors |
| Frontend | `Markdown.test.tsx` | Raw HTML escaped, `javascript:`/`data:` links dropped, external links `noopener`, images not rendered |
| Frontend | `ArticlePage.test.tsx` | Language choice with per-field English fallback, RTL body, localised date, meta tags, not-found, retry |
| Frontend | `AdminApp.test.tsx` | Key kept in sessionStorage only, sign out, rejected key, one list load, filters, copy/reset/delete with confirmation |
| Frontend | `ArticleEditor.test.tsx` | Missing-field warnings, Publish blocked, save/publish/unpublish flow, unsaved-changes guards, preview, toolbar |
| Frontend | `markdownTools.test.ts` | Toolbar Markdown insertion |
| Frontend | `MapErrorBoundary.test.tsx` | Error catch, fallback render, reset |

# Project Context

## What this is
An educational website about the Islamic pilgrimage of Hajj. Four pages:
- **Home** — hero + entry cards + stats
- **The Journey** — step-by-step narrative of the pilgrimage rites
- **Meeqat Points** — interactive Leaflet map of the 5 Ihram stations
- **Sacred Boundaries** — interactive Leaflet map of the Haram boundary polygon

Live: frontend on Netlify, backend on Render (Docker), PostgreSQL managed by Render.

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

**Flyway manages all schema changes.** Never use `ddl-auto=create` or `ddl-auto=update` in production. New migrations go in `backend/src/main/resources/db/migration/` as `V{n}__description.sql`. The `FlywayConfig` bean runs `repair()` before `migrate()` to handle partial-failure recovery on Render. The full schema lives in a single `V1__create_and_seed.sql` — do not edit it once deployed, add a new `V2__...` for any future changes.

**Rate limiting is DB-driven and acts as an allowlist.** The `api_config` table (seeded by `V1__create_and_seed.sql`) stores per-path request limits. `RateLimitFilter` rejects any `/api/*` path not registered in this table with a 404 — to expose a new endpoint, add a Flyway migration inserting a row. Current limits: 20 req/min for public endpoints, 10 req/min for `/api/admin`, 60 req/min for `/api/analytics`. The cache is pre-warmed on startup via `@EventListener(ApplicationReadyEvent.class)` and injected `@Lazy` into the filter to avoid Spring context ordering issues.

**Admin endpoints require `X-Admin-Key` header.** The key is set via the `ADMIN_API_KEY` environment variable. Default for local dev: `dev-admin-key`. Production key must be set on Render. Auth is checked manually in each admin controller — do not replace this with Spring Security roles, it is intentionally simple for a single-admin setup.

**Frontend API base URL** is baked in at build time via `VITE_API_BASE_URL`. Set on Netlify for production. In local dev, Vite proxies `/api/*` to `http://localhost:8080`.

---

## Database tables

| Table | Purpose |
|---|---|
| `meeqat_point` | Five fixed Ihram stations. VARCHAR slug PK (e.g. `dhul-hulayfah`) — intentional, dataset is static |
| `meeqat_images` | Gallery images per Meeqat point. No PK — managed as JPA `@ElementCollection` |
| `journey_step` | Seven Hajj pilgrimage steps shown as a timeline. Editable via admin API |
| `haram_boundary` | Named sacred boundaries drawn as circles on the map (center + radius) |
| `boundary_point` | Polygon vertices for the Haram boundary overlay, ordered by `order_index` |
| `api_config` | Allowlist + rate limits for every `/api/*` path. Path is a prefix (e.g. `/api/meeqat` covers all sub-paths) |
| `page_view` | Raw page-view events for analytics. `session_id` from sessionStorage for privacy-friendly unique visitor counts |

Schema documentation is stored in the database itself via `COMMENT ON TABLE / COLUMN` (see `V6__schema_documentation.sql`).

---

## Features

### Page analytics
- Frontend: `Analytics.tsx` (render-less component inside `BrowserRouter`) fires `navigator.sendBeacon` on every route change. Uses `sessionStorage` UUID as session ID — resets on tab close, no personal data stored.
- Backend: `POST /api/analytics/view` (public) → `AnalyticsService` → `page_view` table.
- Admin queries: `GET /api/admin/analytics/summary?days=N` and `/trend?days=N` (both require `X-Admin-Key`). `days=0` means all-time.

### Editable content
- `PUT /api/admin/content/journey/{id}` — updates a journey step (title, description, border/title colours). Null fields are ignored (partial update).
- `PUT /api/admin/content/meeqat/{id}` — updates a Meeqat point's display fields. Lat/lng are excluded (coordinates are fixed).
- Both endpoints evict the relevant Caffeine cache (`@CacheEvict(allEntries=true)`) and are `@Transactional`.

### Spring Security
- `SecurityConfig.java` — CSRF disabled, stateless sessions, `/api/**` permitted, everything else denied (`denyAll()`).
- This locks down Spring Actuator paths. Actuator itself is also configured to only expose `/actuator/health` with `show-details=never` (see `application.properties`). The two are independent layers — Security is defence-in-depth in case the Actuator exposure config is accidentally widened.

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

| Service | Trigger | Config |
|---|---|---|
| Netlify | Push to `main` | `netlify.toml` — build: `cd frontend && npm install && npm run build` |
| Render | Push to `main` | Builds from `backend/Dockerfile`, exposes port 8080 |

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
| Backend | `RuntimeStoreTest` | In-memory key/value store |
| Backend | `JourneyServiceTest` | `findAllOrdered()` delegation and ordering |
| Backend | `MeeqatServiceTest` | `findAll()`, `findById()`, 404 case |
| Backend | `BoundaryServiceTest` | `findAllBoundaries()`, `findAllBoundaryPoints()` |
| Backend | `ApiConfigServiceTest` | Longest-prefix matching logic |
| Frontend | `client.test.ts` | API client cache — deduplication, retry after failure, single network call |
| Frontend | `array.test.ts` | `requireArray` utility |
| Frontend | `useMeta.test.ts` | Document title and meta tag updates |
| Frontend | `useApi.test.ts` | Loading / error / retry state transitions |
| Frontend | `MapErrorBoundary.test.tsx` | Error catch, fallback render, reset |

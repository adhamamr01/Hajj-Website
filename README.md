# Journey to Hajj

An educational web application about the Islamic pilgrimage of Hajj — covering the Meeqat boundary points, the step-by-step journey, and the sacred boundaries around Makkah, with interactive maps throughout.

**Live site:** https://hajj-guide-website.netlify.app  
**API:** deployed on Render (URL set as `VITE_API_BASE_URL` in Netlify environment variables — not committed to the repo)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Maps | Leaflet · react-leaflet · CartoDB Voyager tiles |
| Backend | Spring Boot 3.2 · Java 21 · Spring Data JPA |
| Database | PostgreSQL 18 (Render managed) |
| Migrations | Flyway 9 |
| Cache | Spring Cache · Caffeine (1 h TTL) |
| Frontend host | Netlify (auto-deploy from `main`) |
| Backend host | Render (Docker, auto-deploy from `main`) |

---

## Pages

- **Home** — overview with hero, entry-point cards and an info section
- **The Meeqat** — interactive Leaflet map showing all five Meeqat points with arcs, route lines, image galleries and Google Maps navigation
- **Hajj Journey** — step-by-step narrative of the pilgrimage rites
- **Sacred Boundaries** — map of the Haram boundary polygon around Makkah

---

## Running locally

### Prerequisites
- Java 21
- Maven 3.9+
- Node 18+
- Docker & Docker Compose (for the local PostgreSQL database)

### 1 — Start the database
```bash
docker compose up -d
```
This starts a PostgreSQL 16 container on `localhost:5432` with database `hajjdb`, user `hajj`, password `hajj`.

### 2 — Start the backend
```bash
cd backend
mvn spring-boot:run
```
Flyway runs the migrations automatically on startup. The API is available at `http://localhost:8080/api`.

### 3 — Start the frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs at `http://localhost:5173`. It calls the backend at `http://localhost:8080/api` via the Vite dev proxy (no CORS issues locally).

---

## Project structure

```
.
├── backend/                  Spring Boot application
│   ├── src/main/java/com/hajj/backend/
│   │   ├── config/           CORS, Flyway strategy, cache
│   │   ├── controller/       REST endpoints (/api/meeqat, /api/journey, /api/boundary)
│   │   ├── model/            JPA entities
│   │   ├── repository/       Spring Data repositories
│   │   └── service/          Business logic + @Cacheable
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-prod.properties
│   │   └── db/migration/V1__create_and_seed.sql
│   └── Dockerfile
├── frontend/                 Vite + React SPA
│   ├── src/
│   │   ├── api/              Axios client
│   │   ├── components/       MeeqatMap, HaramBoundaryMap, Navbar, …
│   │   ├── pages/            Home, MapRoute, Journey, MapSites
│   │   └── types/            Shared TypeScript interfaces
│   └── vite.config.ts
├── docker-compose.yml        Local dev database
└── netlify.toml              Netlify build config + SPA redirect
```

---

## Deployment

### Backend (Render)
1. Push to `main` — Render builds the Docker image automatically.
2. Set the following environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | *(Render PostgreSQL internal URL)* |
| `SPRING_DATASOURCE_USERNAME` | *(DB user)* |
| `SPRING_DATASOURCE_PASSWORD` | *(DB password)* |

3. Health check path: `/actuator/health`

### Frontend (Netlify)
1. Push to `main` — Netlify runs `cd frontend && npm install && npm run build`.
2. Set the following environment variable in the Netlify dashboard (not committed to the repo):

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |

3. The `[[redirects]]` rule in `netlify.toml` sends all unmatched routes to `index.html` for React Router.

> **Note:** `VITE_API_BASE_URL` is embedded into the JS bundle at build time and is therefore visible in the browser regardless. Keeping it out of the repo avoids committing environment-specific URLs; it does not hide the URL from users.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/meeqat` | All five Meeqat points with images |
| GET | `/api/meeqat/{id}` | Single Meeqat point |
| GET | `/api/journey` | Hajj journey steps in order |
| GET | `/api/boundary` | Haram boundary circles |
| GET | `/api/boundary/points` | Haram boundary polygon vertices |
| GET | `/actuator/health` | Health check |

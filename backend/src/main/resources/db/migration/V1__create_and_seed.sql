-- ── Schema ────────────────────────────────────────────────────────────────

CREATE TABLE meeqat_point (
    id           VARCHAR(50)      PRIMARY KEY,
    name         VARCHAR(255)     NOT NULL,
    lat          DOUBLE PRECISION NOT NULL,
    lng          DOUBLE PRECISION NOT NULL,
    direction    VARCHAR(50),
    for_pilgrims VARCHAR(255),
    distance     VARCHAR(20),
    color        VARCHAR(10),
    modern       VARCHAR(255),
    description  TEXT,
    video_url    VARCHAR(255)
);

CREATE TABLE meeqat_images (
    meeqat_id  VARCHAR(50)  REFERENCES meeqat_point(id) ON DELETE CASCADE,
    image_url  VARCHAR(255)
);

CREATE TABLE journey_step (
    id            BIGSERIAL    PRIMARY KEY,
    step_number   INTEGER      NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    border_color  VARCHAR(50),
    title_color   VARCHAR(50)
);

CREATE TABLE haram_boundary (
    id          BIGSERIAL        PRIMARY KEY,
    name        VARCHAR(255)     NOT NULL,
    description TEXT,
    center_lat  DOUBLE PRECISION NOT NULL,
    center_lng  DOUBLE PRECISION NOT NULL,
    radius      DOUBLE PRECISION NOT NULL,
    color       VARCHAR(10)
);

CREATE TABLE boundary_point (
    id          BIGSERIAL        PRIMARY KEY,
    name        VARCHAR(255),
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    order_index INTEGER          NOT NULL
);

CREATE TABLE api_config (
    id                      BIGSERIAL    PRIMARY KEY,
    path                    VARCHAR(255) NOT NULL UNIQUE,
    max_requests_per_minute INTEGER      NOT NULL,
    enabled                 BOOLEAN      NOT NULL DEFAULT TRUE,
    description             VARCHAR(255)
);

CREATE TABLE page_view (
    id         BIGSERIAL    PRIMARY KEY,
    page       VARCHAR(100) NOT NULL,
    session_id VARCHAR(36),
    viewed_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Covers both per-page queries (WHERE page = ? AND viewed_at >= ?)
-- and all-pages queries (WHERE viewed_at >= ?).
CREATE INDEX idx_page_view_page_time ON page_view (page, viewed_at);

-- ── Schema documentation ──────────────────────────────────────────────────

COMMENT ON TABLE meeqat_point IS
    'The five Islamic Ihram stations (Mawaqit) where pilgrims enter the state of Ihram. '
    'This is a fixed, static dataset — there are exactly five Meeqat points established '
    'by Islamic law and their locations will never change.';

COMMENT ON COLUMN meeqat_point.id IS
    'URL-safe slug used as the primary key (e.g. dhul-hulayfah). '
    'Kept as VARCHAR instead of a BIGSERIAL because the dataset is static and the slug '
    'IS the meaningful identity for each point — there is no benefit to a surrogate key here.';

COMMENT ON COLUMN meeqat_point.name IS
    'Classical Arabic name of the Meeqat station.';

COMMENT ON COLUMN meeqat_point.modern IS
    'Modern city or landmark name for the same location, shown as an alternate label in the UI.';

COMMENT ON COLUMN meeqat_point.for_pilgrims IS
    'Which regions or nationalities use this Meeqat according to Islamic rulings.';

COMMENT ON COLUMN meeqat_point.direction IS
    'Cardinal direction from Makkah (e.g. North, Southeast). Used in the UI card.';

COMMENT ON COLUMN meeqat_point.distance IS
    'Approximate straight-line distance from Makkah, stored as a display string (e.g. ~450 km).';

COMMENT ON COLUMN meeqat_point.color IS
    'Hex colour for the map marker and UI accent. Each station has a distinct colour.';

COMMENT ON COLUMN meeqat_point.video_url IS
    'Optional YouTube or hosted video URL for the detail panel. Empty string if none.';

COMMENT ON TABLE meeqat_images IS
    'One-to-many gallery images for each Meeqat point. '
    'No primary key because rows are always loaded as a collection via the meeqat_point entity '
    'and are never addressed individually. Managed by JPA @ElementCollection.';

COMMENT ON COLUMN meeqat_images.meeqat_id IS
    'Foreign key to meeqat_point.id (the slug).';

COMMENT ON COLUMN meeqat_images.image_url IS
    'Relative path from the static file root (e.g. /images/dhul-hulayfah-1.jpg).';

COMMENT ON TABLE journey_step IS
    'The seven sequential steps of the Hajj pilgrimage, shown as a timeline in the UI. '
    'Content is editable via PUT /api/admin/content/journey/{id}. '
    'Cache is stored under the "journey" Caffeine cache and evicted on every admin update.';

COMMENT ON COLUMN journey_step.step_number IS
    'Display order (1–7). Kept separate from the surrogate id so the order can in theory '
    'be changed without renumbering primary keys.';

COMMENT ON COLUMN journey_step.border_color IS
    'Tailwind CSS border colour class (e.g. border-primary). Stored in DB so it can be '
    'updated without a code deploy.';

COMMENT ON COLUMN journey_step.title_color IS
    'Tailwind CSS text colour class (e.g. text-amber-600). Same rationale as border_color.';

COMMENT ON TABLE haram_boundary IS
    'Named sacred boundaries around Makkah drawn on the map as circles. '
    'Two rows: Masjid al-Haram (inner) and Al-Haram (outer boundary). '
    'Circle approach was chosen over a polygon because the boundaries are approximately '
    'circular and a radius is far simpler to render with Leaflet.';

COMMENT ON COLUMN haram_boundary.radius IS
    'Radius in kilometres. Rendered as a Leaflet circle on the frontend map.';

COMMENT ON TABLE boundary_point IS
    'Polygon vertices for the Haram boundary map overlay. '
    'Not linked to haram_boundary by FK — all points are loaded as a single polygon '
    'since there is only one polygon boundary in practice. '
    'order_index determines the winding order of the polygon vertices.';

COMMENT ON COLUMN boundary_point.order_index IS
    'Zero-based index defining the vertex order when drawing the polygon. '
    'Rows must be sorted by this column before constructing the polygon.';

COMMENT ON TABLE api_config IS
    'Allowlist and rate-limit configuration for /api/* endpoints. '
    'Every /api/* path must have a matching row here or RateLimitFilter rejects it with 404. '
    'To expose a new endpoint: add a Flyway migration that inserts a row — no code change needed. '
    'To block an endpoint temporarily: set enabled = false. '
    'Limits are cached in Caffeine for 60 minutes; call POST /api/admin/cache/refresh/apiConfig to reload.';

COMMENT ON COLUMN api_config.path IS
    'Path prefix used for longest-prefix matching (e.g. /api/meeqat covers /api/meeqat/{id}). '
    'Must be unique.';

COMMENT ON COLUMN api_config.max_requests_per_minute IS
    'Sliding-window rate limit per IP per minute for this path prefix. '
    'Each prefix has an independent window so bursting on one endpoint does not '
    'consume another endpoint''s budget for the same IP.';

COMMENT ON COLUMN api_config.enabled IS
    'false = RateLimitFilter treats the path as unregistered and returns 404. '
    'Use this to disable an endpoint without deleting the row.';

COMMENT ON TABLE page_view IS
    'Raw page-view events recorded by the Analytics component on the frontend. '
    'One row per page visit. Queried in aggregate — never read row by row. '
    'The index on (page, viewed_at) supports the summary and daily-trend queries '
    'which always filter by page and a time window.';

COMMENT ON COLUMN page_view.session_id IS
    'UUID generated in sessionStorage (resets when the browser tab closes). '
    'Used to count unique visitors without storing any personal data. '
    'A COUNT(DISTINCT session_id) over a time window gives unique-visitor counts. '
    'Not a FK — session state lives only in the browser.';

COMMENT ON COLUMN page_view.page IS
    'React Router pathname at the time of the visit (e.g. /journey, /map/sites). '
    'Capped at 100 characters; longer paths are truncated by the service layer.';

-- ── Seed data ─────────────────────────────────────────────────────────────

INSERT INTO meeqat_point (id, name, lat, lng, direction, for_pilgrims, distance, color, modern, description, video_url) VALUES
  ('dhul-hulayfah', 'Dhul-Hulayfah (Abyar Ali)',
   24.41406002656528, 39.54286561840277,
   'North', 'People from Madinah and regions to the north',
   '~450 km', '#e74c3c', 'Near Masjid ash-Shajarah',
   'The Meeqat for pilgrims coming from Madinah, located near the famous Masjid ash-Shajarah where the Prophet ﷺ entered Ihram.',
   ''),
  ('al-juhfah', 'Al-Juhfah (Rabigh)',
   22.70560101031339, 39.14643816586369,
   'Northwest', 'People from Syria, Egypt, Morocco, and the west',
   '~187 km', '#3498db', 'Near Rabigh city',
   'The Meeqat for pilgrims coming from the northwest, including Syria, Egypt, and North Africa.',
   ''),
  ('qarn-al-manazil', 'Qarn al-Manazil (As-Sayl)',
   21.632843070547295, 40.42803494940863,
   'East', 'People from Najd and regions to the east',
   '~94 km', '#f39c12', 'As-Sayl al-Kabir',
   'The Meeqat for pilgrims coming from the Najd region and eastern areas, now known as As-Sayl al-Kabir.',
   ''),
  ('yalamlam', 'Yalamlam (Sa''diyah)',
   20.517434830881925, 39.871136544178604,
   'South', 'People from Yemen and regions to the south',
   '~120 km', '#9b59b6', 'Near Sa''diyah',
   'The Meeqat for pilgrims coming from Yemen and southern regions.',
   ''),
  ('dhat-irq', 'Dhat ''Irq',
   21.930162470128362, 40.425496742328555,
   'Northeast', 'People from Iraq and regions to the northeast',
   '~94 km', '#27ae60', 'Dhat ''Irq checkpoint',
   'The Meeqat for pilgrims coming from Iraq and northeastern regions.',
   '');

INSERT INTO meeqat_images (meeqat_id, image_url) VALUES
  ('dhul-hulayfah', '/images/dhul-hulayfah-1.jpg'),
  ('dhul-hulayfah', '/images/dhul-hulayfah-2.jpg'),
  ('dhul-hulayfah', '/images/dhul-hulayfah-3.jpg'),
  ('dhul-hulayfah', '/images/dhul-hulayfah-4.jpg'),
  ('al-juhfah',     '/images/al-juhfah-1.jpg'),
  ('al-juhfah',     '/images/al-juhfah-2.jpg'),
  ('al-juhfah',     '/images/al-juhfah-3.jpg'),
  ('al-juhfah',     '/images/al-juhfah-4.jpg'),
  ('qarn-al-manazil', '/images/qarn-al-manazil-1.jpg'),
  ('qarn-al-manazil', '/images/qarn-al-manazil-2.jpg'),
  ('qarn-al-manazil', '/images/qarn-al-manazil-3.jpg'),
  ('qarn-al-manazil', '/images/qarn-al-manazil-4.jpg'),
  ('yalamlam',      '/images/yalamlam-1.jpg'),
  ('yalamlam',      '/images/yalamlam-2.jpg'),
  ('yalamlam',      '/images/yalamlam-3.jpg'),
  ('yalamlam',      '/images/yalamlam-4.jpg'),
  ('dhat-irq',      '/images/dhat-irq-1.jpg'),
  ('dhat-irq',      '/images/dhat-irq-2.jpg'),
  ('dhat-irq',      '/images/dhat-irq-3.jpg'),
  ('dhat-irq',      '/images/dhat-irq-4.jpg');

INSERT INTO journey_step (step_number, title, description, border_color, title_color) VALUES
  (1, 'Intention & Preparation',
   'The journey begins with sincere intention (niyyah), seeking Allah''s pleasure alone. Pilgrims prepare physically, mentally, and spiritually, learning the rites and ensuring their means are halal.',
   'border-primary', 'text-primary'),
  (2, 'Ihram & Meeqat',
   'Before crossing into the sacred boundary of Makkah, pilgrims enter the state of Ihram at one of the Meeqat points. This is where the prohibitions of Ihram begin and the Talbiyah is recited.',
   'border-amber-500', 'text-amber-600'),
  (3, 'Arrival in Makkah & Tawaf al-Qudum',
   'Upon reaching Makkah, many pilgrims perform the arrival Tawaf around the Ka''bah, expressing love and awe for the sacred House of Allah.',
   'border-blue-500', 'text-blue-600'),
  (4, 'Sa''i between Safa and Marwah',
   'Pilgrims walk between the hills of Safa and Marwah, remembering the devotion of Hajar (may Allah be pleased with her) as she searched for water for her son Ismail.',
   'border-emerald-500', 'text-emerald-600'),
  (5, 'The Days of Mina, Arafah & Muzdalifah',
   'Pilgrims travel to Mina, then stand at Arafah on the 9th of Dhul-Hijjah, the pinnacle of Hajj. After sunset they move to Muzdalifah, spending the night under the open sky.',
   'border-purple-500', 'text-purple-600'),
  (6, 'Stoning, Sacrifice & Tawaf al-Ifadah',
   'Pilgrims stone the Jamarat, offer the sacrifice, and perform Tawaf al-Ifadah in Makkah. Many of the restrictions of Ihram are lifted after this stage.',
   'border-rose-500', 'text-rose-600'),
  (7, 'Farewell Tawaf',
   'Before departing Makkah, pilgrims perform a final Tawaf (Tawaf al-Wada''), bidding farewell to the Sacred House and asking Allah to accept their Hajj.',
   'border-gray-600', 'text-gray-800');

INSERT INTO haram_boundary (name, description, center_lat, center_lng, radius, color) VALUES
  ('Masjid al-Haram',
   'The central sacred mosque in Makkah that surrounds the Ka''bah, the focal point of all Muslim prayer.',
   21.4225, 39.8262, 3.0, '#16a34a'),
  ('Al-Haram Boundary',
   'The wider sanctuary boundary around Makkah within which hunting and cutting trees is prohibited.',
   21.4225, 39.8262, 15.0, '#f97316');

INSERT INTO boundary_point (name, lat, lng, order_index) VALUES
  ('إضاء لبن (Idhat Liban)',         21.314,    39.8,      0),
  ('جبل عرفات ذات سليم',             21.3667,   40.0017,   1),
  ('وادي نخلة',                      21.6,      40.02,     2),
  ('الجعرانة',                       21.567,    39.95,     3),
  ('التنعيم',                        21.467978, 39.801154, 4),
  ('منقطع الأعشاش بالحديبية',        21.442102, 39.625658, 5);

INSERT INTO api_config (path, max_requests_per_minute, enabled, description) VALUES
  ('/api/meeqat',    20,  true, 'Meeqat station data — read-only, served from cache'),
  ('/api/journey',   20,  true, 'Hajj journey steps — read-only, served from cache'),
  ('/api/boundary',  20,  true, 'Haram boundary data — read-only, served from cache'),
  ('/api/admin',     10,  true, 'Admin operations — cache management and content editing'),
  ('/api/analytics', 60,  true, 'Page view recording — one POST per page visit per user');

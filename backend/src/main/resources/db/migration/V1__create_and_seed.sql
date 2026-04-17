-- Idempotent migration: safe to run against both a fresh database and one
-- whose schema was previously created by Hibernate (ddl-auto=update).
-- CREATE TABLE IF NOT EXISTS skips existing tables.
-- Inserts are guarded so they only run when the target table is empty.

-- ── Schema ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meeqat_point (
    id           VARCHAR(50)  PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
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

CREATE TABLE IF NOT EXISTS meeqat_images (
    meeqat_id  VARCHAR(50)  REFERENCES meeqat_point(id),
    image_url  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS journey_step (
    id            BIGSERIAL PRIMARY KEY,
    step_number   INTEGER      NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    border_color  VARCHAR(50),
    title_color   VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS haram_boundary (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    center_lat  DOUBLE PRECISION NOT NULL,
    center_lng  DOUBLE PRECISION NOT NULL,
    radius      DOUBLE PRECISION NOT NULL,
    color       VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS boundary_point (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255),
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    order_index INTEGER NOT NULL
);

-- ── Meeqat points ─────────────────────────────────────────────────────────
-- String primary key: ON CONFLICT (id) DO NOTHING handles existing rows.

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
   '')
ON CONFLICT (id) DO NOTHING;

-- ── Meeqat images ─────────────────────────────────────────────────────────
-- No primary key on this table, so guard with a table-empty check.

INSERT INTO meeqat_images (meeqat_id, image_url)
SELECT meeqat_id, image_url FROM (VALUES
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
  ('dhat-irq',      '/images/dhat-irq-4.jpg')
) AS v(meeqat_id, image_url)
WHERE NOT EXISTS (SELECT 1 FROM meeqat_images LIMIT 1);

-- ── Journey steps ─────────────────────────────────────────────────────────

INSERT INTO journey_step (step_number, title, description, border_color, title_color)
SELECT * FROM (VALUES
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
   'border-gray-600', 'text-gray-800')
) AS v(step_number, title, description, border_color, title_color)
WHERE NOT EXISTS (SELECT 1 FROM journey_step LIMIT 1);

-- ── Haram boundaries ──────────────────────────────────────────────────────

INSERT INTO haram_boundary (name, description, center_lat, center_lng, radius, color)
SELECT * FROM (VALUES
  ('Masjid al-Haram',
   'The central sacred mosque in Makkah that surrounds the Ka''bah, the focal point of all Muslim prayer.',
   21.4225, 39.8262, 3.0, '#16a34a'),
  ('Al-Haram Boundary',
   'The wider sanctuary boundary around Makkah within which hunting and cutting trees is prohibited.',
   21.4225, 39.8262, 15.0, '#f97316')
) AS v(name, description, center_lat, center_lng, radius, color)
WHERE NOT EXISTS (SELECT 1 FROM haram_boundary LIMIT 1);

-- ── Boundary polygon points ───────────────────────────────────────────────

INSERT INTO boundary_point (name, lat, lng, order_index)
SELECT * FROM (VALUES
  ('إضاء لبن (Idhat Liban)',         21.314,    39.8,      0),
  ('جبل عرفات ذات سليم',             21.3667,   40.0017,   1),
  ('وادي نخلة',                      21.6,      40.02,     2),
  ('الجعرانة',                       21.567,    39.95,     3),
  ('التنعيم',                        21.467978, 39.801154, 4),
  ('منقطع الأعشاش بالحديبية',        21.442102, 39.625658, 5)
) AS v(name, lat, lng, order_index)
WHERE NOT EXISTS (SELECT 1 FROM boundary_point LIMIT 1);

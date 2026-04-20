-- Page view analytics table.
-- Recorded by the frontend on every route change via POST /api/analytics/view.
-- session_id is a UUID generated client-side in sessionStorage — resets on tab
-- close, never tracks users across sessions, allows unique visitor counts.

CREATE TABLE page_view (
    id         BIGSERIAL    PRIMARY KEY,
    page       VARCHAR(100) NOT NULL,
    session_id VARCHAR(36),
    viewed_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Composite index covers the two most common query shapes:
--   WHERE page = ? AND viewed_at >= ?   (per-page stats for a date range)
--   WHERE viewed_at >= ?                (all-pages stats for a date range)
CREATE INDEX idx_page_view_page_time ON page_view (page, viewed_at);

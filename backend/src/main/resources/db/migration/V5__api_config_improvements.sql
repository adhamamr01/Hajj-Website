-- Add a description column so each row explains why it has its limit.
ALTER TABLE api_config ADD COLUMN description VARCHAR(255);

UPDATE api_config SET description = 'Meeqat station data — read-only, served from cache'         WHERE path = '/api/meeqat';
UPDATE api_config SET description = 'Hajj journey steps — read-only, served from cache'           WHERE path = '/api/journey';
UPDATE api_config SET description = 'Haram boundary data — read-only, served from cache'          WHERE path = '/api/boundary';
UPDATE api_config SET description = 'Admin operations — cache management and content editing'     WHERE path = '/api/admin';

-- Analytics endpoint added in V4. Higher limit because sendBeacon fires on every page visit.
INSERT INTO api_config (path, max_requests_per_minute, enabled, description) VALUES
    ('/api/analytics', 60, true, 'Page view recording — one POST per page visit per user')
ON CONFLICT (path) DO NOTHING;

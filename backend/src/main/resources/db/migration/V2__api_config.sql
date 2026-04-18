-- API configuration table.
-- Each row defines a path prefix and its rate limit.
-- Any /api/* request whose path doesn't match a prefix in this table
-- is rejected with 404 by RateLimitFilter.
-- Prefix matching is used: /api/meeqat covers /api/meeqat and /api/meeqat/{id}.

CREATE TABLE IF NOT EXISTS api_config (
    id                      BIGSERIAL    PRIMARY KEY,
    path                    VARCHAR(255) NOT NULL UNIQUE,
    max_requests_per_minute INTEGER      NOT NULL,
    enabled                 BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Seed current API paths.
-- max_requests_per_minute is enforced per unique IP address.
INSERT INTO api_config (path, max_requests_per_minute, enabled) VALUES
    ('/api/meeqat',    20, true),
    ('/api/journey',   20, true),
    ('/api/boundary',  20, true),
    ('/api/admin',     10, true)
ON CONFLICT (path) DO NOTHING;

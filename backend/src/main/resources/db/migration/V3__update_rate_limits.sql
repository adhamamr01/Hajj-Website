-- Reduce rate limits now that client-side caching is in place.
-- Static read endpoints only need to be hit once per page visit.
UPDATE api_config SET max_requests_per_minute = 20 WHERE path = '/api/meeqat';
UPDATE api_config SET max_requests_per_minute = 20 WHERE path = '/api/journey';
UPDATE api_config SET max_requests_per_minute = 20 WHERE path = '/api/boundary';

-- Rate limits are now hardcoded in RateLimitFilter.RATE_LIMITS.
-- The api_config table and its data are no longer needed.
DROP TABLE IF EXISTS api_config;

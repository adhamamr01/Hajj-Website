package com.hajj.backend.service;

import com.hajj.backend.model.ApiConfig;
import com.hajj.backend.repository.ApiConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Reads API rate-limit configuration from the database and provides
 * longest-prefix matching so each endpoint can have its own limit.
 *
 * Config rows live in the api_config table (seeded by Flyway migrations).
 * To change a limit, add a new migration — do not edit the code.
 *
 * The full config list is loaded into Caffeine on startup (warmCache) so
 * RateLimitFilter never waits for a DB round-trip on the first request.
 */
@Service
public class ApiConfigService {

    private static final Logger log = LoggerFactory.getLogger(ApiConfigService.class);

    private final ApiConfigRepository repository;

    public ApiConfigService(ApiConfigRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns all enabled API configs.
     * Result is cached in Caffeine for 60 minutes (see CacheManagerConfig).
     * Restart the app or call POST /api/admin/cache/refresh/apiConfig to reload.
     */
    @Cacheable("apiConfig")
    public List<ApiConfig> findAllEnabled() {
        return repository.findByEnabledTrue();
    }

    /**
     * Finds the most specific (longest) path prefix that matches the given
     * request path, considering only enabled configs.
     *
     * Examples:
     *   /api/meeqat/dhul-hulayfah  →  matches /api/meeqat  (prefix)
     *   /api/boundary/points       →  matches /api/boundary (prefix)
     *   /api/unknown               →  empty (no match)
     */
    public Optional<ApiConfig> findMatchingConfig(String requestPath) {
        return findAllEnabled().stream()
                .filter(c -> requestPath.startsWith(c.getPath()))
                .max(Comparator.comparingInt(c -> c.getPath().length()));
    }

    /**
     * Pre-warms the apiConfig cache as soon as the application is ready.
     * This guarantees the config is in memory before the first request arrives
     * so RateLimitFilter never blocks on a DB hit.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void warmCache() {
        List<ApiConfig> configs = findAllEnabled();
        log.info("api_config cache warmed — {} enabled path(s): {}",
                configs.size(),
                configs.stream().map(ApiConfig::getPath).toList());
    }
}

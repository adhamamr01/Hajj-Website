package com.hajj.backend.service;

import com.hajj.backend.model.ApiConfig;
import com.hajj.backend.repository.ApiConfigRepository;
import org.springframework.cache.annotation.Cacheable;
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
 */
@Service
public class ApiConfigService {

    private final ApiConfigRepository repository;

    public ApiConfigService(ApiConfigRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns all enabled API configs.
     * Cached for 1 hour (Caffeine) — restart or cache eviction picks up DB changes.
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
}

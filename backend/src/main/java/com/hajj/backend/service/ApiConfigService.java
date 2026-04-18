package com.hajj.backend.service;

import com.hajj.backend.model.ApiConfig;
import com.hajj.backend.repository.ApiConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApiConfigService {

    private final ApiConfigRepository repository;

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

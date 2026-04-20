package com.hajj.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Admin endpoints for cache management.
 * All endpoints require the X-Admin-Key header.
 *
 *   GET  /api/admin/cache              — list all caches with hit/miss stats
 *   POST /api/admin/cache/refresh      — evict every cache
 *   POST /api/admin/cache/refresh/{name} — evict one named cache
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CacheManager cacheManager;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminController(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    // ── Cache endpoints ───────────────────────────────────────────────────

    /** Lists every cache with its Caffeine hit/miss statistics. */
    @GetMapping("/cache")
    public ResponseEntity<?> listCaches(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (!authorized(key)) return unauthorized();

        Map<String, Object> stats = new LinkedHashMap<>();
        for (String name : sorted(cacheManager.getCacheNames())) {
            stats.put(name, buildStats(name));
        }
        return ResponseEntity.ok(stats);
    }

    /** Evicts all caches. */
    @PostMapping("/cache/refresh")
    public ResponseEntity<?> refreshAll(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (!authorized(key)) return unauthorized();

        List<String> evicted = new ArrayList<>();
        for (String name : cacheManager.getCacheNames()) {
            Objects.requireNonNull(cacheManager.getCache(name)).clear();
            evicted.add(name);
        }
        return ResponseEntity.ok(Map.of("refreshed", evicted));
    }

    /** Evicts a single named cache. */
    @PostMapping("/cache/refresh/{name}")
    public ResponseEntity<?> refreshOne(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable String name) {
        if (!authorized(key)) return unauthorized();

        var cache = cacheManager.getCache(name);
        if (cache == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "Cache not found: " + name));
        }
        cache.clear();
        return ResponseEntity.ok(Map.of("refreshed", name));
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private boolean authorized(String key) {
        return adminApiKey.equals(key);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing admin key"));
    }

    private Map<String, Object> buildStats(String name) {
        var cache = cacheManager.getCache(name);
        if (!(cache instanceof CaffeineCache caffeineCache)) {
            return Map.of("stats", "unavailable");
        }
        var s = caffeineCache.getNativeCache().stats();
        return Map.of(
                "hitCount",      s.hitCount(),
                "missCount",     s.missCount(),
                "hitRate",       String.format("%.1f%%", s.hitRate() * 100),
                "evictionCount", s.evictionCount(),
                "estimatedSize", caffeineCache.getNativeCache().estimatedSize()
        );
    }

    private List<String> sorted(Collection<String> names) {
        return names.stream().sorted().toList();
    }
}

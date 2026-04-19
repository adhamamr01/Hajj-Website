package com.hajj.backend.controller;

import com.hajj.backend.service.RuntimeStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Admin endpoints for cache management and runtime variable store.
 * All endpoints require the X-Admin-Key header.
 *
 * Cache endpoints:
 *   GET  /api/admin/cache              — list all caches with hit/miss stats
 *   POST /api/admin/cache/refresh      — evict every cache
 *   POST /api/admin/cache/refresh/{name} — evict one named cache
 *
 * Runtime store endpoints:
 *   GET    /api/admin/store            — list all key/value pairs
 *   GET    /api/admin/store/{key}      — get one value
 *   PUT    /api/admin/store/{key}      — set a value (body: plain text)
 *   DELETE /api/admin/store/{key}      — remove a key
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CacheManager cacheManager;
    private final RuntimeStore runtimeStore;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminController(CacheManager cacheManager, RuntimeStore runtimeStore) {
        this.cacheManager = cacheManager;
        this.runtimeStore = runtimeStore;
    }

    // ── Cache endpoints ───────────────────────────────────────────────────

    /** Lists every cache with its Caffeine hit/miss statistics. */
    @GetMapping("/cache")
    public ResponseEntity<?> listCaches(@RequestHeader("X-Admin-Key") String key) {
        if (!authorized(key)) return unauthorized();

        Map<String, Object> stats = new LinkedHashMap<>();
        for (String name : sorted(cacheManager.getCacheNames())) {
            stats.put(name, buildStats(name));
        }
        return ResponseEntity.ok(stats);
    }

    /** Evicts all caches. */
    @PostMapping("/cache/refresh")
    public ResponseEntity<?> refreshAll(@RequestHeader("X-Admin-Key") String key) {
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
            @RequestHeader("X-Admin-Key") String key,
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

    // ── Runtime store endpoints ────────────────────────────────────────────

    /** Returns all key/value pairs in the runtime store. */
    @GetMapping("/store")
    public ResponseEntity<?> listStore(@RequestHeader("X-Admin-Key") String key) {
        if (!authorized(key)) return unauthorized();
        return ResponseEntity.ok(runtimeStore.getAll());
    }

    /** Returns the value for a single key. */
    @GetMapping("/store/{storeKey}")
    public ResponseEntity<?> getStoreValue(
            @RequestHeader("X-Admin-Key") String key,
            @PathVariable String storeKey) {
        if (!authorized(key)) return unauthorized();

        return runtimeStore.get(storeKey)
                .<ResponseEntity<?>>map(v -> ResponseEntity.ok(Map.of("key", storeKey, "value", v)))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Key not found: " + storeKey)));
    }

    /** Sets a key/value pair. Request body is the plain-text value. */
    @PutMapping("/store/{storeKey}")
    public ResponseEntity<?> setStoreValue(
            @RequestHeader("X-Admin-Key") String key,
            @PathVariable String storeKey,
            @RequestBody String value) {
        if (!authorized(key)) return unauthorized();

        runtimeStore.set(storeKey, value.trim());
        return ResponseEntity.ok(Map.of("key", storeKey, "value", value.trim()));
    }

    /** Deletes a key from the runtime store. */
    @DeleteMapping("/store/{storeKey}")
    public ResponseEntity<?> deleteStoreValue(
            @RequestHeader("X-Admin-Key") String key,
            @PathVariable String storeKey) {
        if (!authorized(key)) return unauthorized();

        boolean removed = runtimeStore.delete(storeKey);
        if (!removed) {
            return ResponseEntity.status(404).body(Map.of("error", "Key not found: " + storeKey));
        }
        return ResponseEntity.ok(Map.of("deleted", storeKey));
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

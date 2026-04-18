package com.hajj.backend.service;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A lightweight in-memory key/value store for application runtime variables.
 *
 * Use this for values that need to be readable and writable at runtime without
 * a full DB table — feature flags, operational notes, dynamic thresholds, etc.
 * Values are plain strings; callers parse to the required type.
 *
 * Data lives only in memory: it resets on restart. For persistence, promote
 * frequently-used keys to a proper DB-backed config table.
 *
 * Exposed via AdminController: GET/PUT/DELETE /api/admin/store/{key}
 */
@Component
public class RuntimeStore {

    private final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();

    public void set(String key, String value) {
        store.put(key, value);
    }

    public Optional<String> get(String key) {
        return Optional.ofNullable(store.get(key));
    }

    public boolean delete(String key) {
        return store.remove(key) != null;
    }

    /** Returns an unmodifiable snapshot of the entire store. */
    public Map<String, String> getAll() {
        return Collections.unmodifiableMap(store);
    }
}

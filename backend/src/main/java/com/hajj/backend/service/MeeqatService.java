package com.hajj.backend.service;

import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.repository.MeeqatRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for Meeqat (Ihram station) data.
 *
 * @Cacheable is placed here, not on the controller, so that any future
 * internal caller also benefits from the cache and the controller stays
 * a thin HTTP adapter with no caching concerns.
 *
 * Cache config (name, TTL, max size) lives in CacheManagerConfig.
 */
@Service
public class MeeqatService {

    private final MeeqatRepository meeqatRepository;

    public MeeqatService(MeeqatRepository meeqatRepository) {
        this.meeqatRepository = meeqatRepository;
    }

    /** Returns all Meeqat points. Result is cached for 60 minutes. */
    @Cacheable("meeqat")
    public List<MeeqatPoint> findAll() {
        return meeqatRepository.findAll();
    }

    @Cacheable(value = "meeqat", key = "#id")
    public MeeqatPoint findById(String id) {
        return meeqatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeqat point not found: " + id));
    }
}

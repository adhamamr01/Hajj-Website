package com.hajj.backend.service;

import com.hajj.backend.dto.UpdateMeeqatPointRequest;
import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.repository.MeeqatRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeqat point not found: " + id));
    }

    /**
     * Updates editable fields on a Meeqat point and evicts the cache so the
     * next read returns the updated content. Null fields in the request are
     * ignored — only non-null values are applied.
     * lat and lng are excluded from updates — they are geographic facts, not editorial.
     */
    @CacheEvict(value = "meeqat", allEntries = true)
    @Transactional
    public MeeqatPoint update(String id, UpdateMeeqatPointRequest req) {
        MeeqatPoint point = meeqatRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeqat point not found: " + id));
        if (req.name()        != null) point.setName(req.name());
        if (req.direction()   != null) point.setDirection(req.direction());
        if (req.forPilgrims() != null) point.setForPilgrims(req.forPilgrims());
        if (req.distance()    != null) point.setDistance(req.distance());
        if (req.description() != null) point.setDescription(req.description());
        if (req.color()       != null) point.setColor(req.color());
        return meeqatRepository.save(point);
    }
}

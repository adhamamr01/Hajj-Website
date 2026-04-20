package com.hajj.backend.service;

import com.hajj.backend.model.BoundaryPoint;
import com.hajj.backend.model.HaramBoundary;
import com.hajj.backend.repository.BoundaryPointRepository;
import com.hajj.backend.repository.HaramBoundaryRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for Haram boundary data (zones and polygon vertices).
 *
 * @Cacheable is placed here, not on the controller, so that any future
 * internal caller also benefits from the cache and the controller stays
 * a thin HTTP adapter with no caching concerns.
 *
 * Cache config (name, TTL, max size) lives in CacheManagerConfig.
 */
@Service
public class BoundaryService {

    private final HaramBoundaryRepository haramBoundaryRepository;
    private final BoundaryPointRepository boundaryPointRepository;

    public BoundaryService(HaramBoundaryRepository haramBoundaryRepository,
                           BoundaryPointRepository boundaryPointRepository) {
        this.haramBoundaryRepository = haramBoundaryRepository;
        this.boundaryPointRepository = boundaryPointRepository;
    }

    @Cacheable("boundaries")
    public List<HaramBoundary> findAllBoundaries() {
        return haramBoundaryRepository.findAll();
    }

    @Cacheable("boundaryPoints")
    public List<BoundaryPoint> findAllBoundaryPoints() {
        return boundaryPointRepository.findAllByOrderByOrderIndexAsc();
    }
}

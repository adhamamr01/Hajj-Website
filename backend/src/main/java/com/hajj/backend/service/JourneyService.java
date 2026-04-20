package com.hajj.backend.service;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.repository.JourneyRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for Hajj journey step data.
 *
 * @Cacheable is placed here, not on the controller, so that any future
 * internal caller also benefits from the cache and the controller stays
 * a thin HTTP adapter with no caching concerns.
 *
 * Cache config (name, TTL, max size) lives in CacheManagerConfig.
 */
@Service
public class JourneyService {

    private final JourneyRepository journeyRepository;

    public JourneyService(JourneyRepository journeyRepository) {
        this.journeyRepository = journeyRepository;
    }

    @Cacheable("journey")
    public List<JourneyStep> findAllOrdered() {
        return journeyRepository.findAllByOrderByStepNumberAsc();
    }
}

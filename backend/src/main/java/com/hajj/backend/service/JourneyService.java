package com.hajj.backend.service;

import com.hajj.backend.dto.UpdateJourneyStepRequest;
import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.repository.JourneyRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /** Returns all steps ordered by stepNumber. Result is cached for 60 minutes. */
    @Cacheable("journey")
    public List<JourneyStep> findAllOrdered() {
        return journeyRepository.findAllByOrderByStepNumberAsc();
    }

    /**
     * Updates editable fields on a journey step and evicts the cache so the
     * next read returns the updated content. Null fields in the request are
     * ignored — only non-null values are applied.
     */
    @CacheEvict(value = "journey", allEntries = true)
    @Transactional
    public JourneyStep update(Long id, UpdateJourneyStepRequest req) {
        JourneyStep step = journeyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journey step not found: " + id));
        if (req.title()       != null) step.setTitle(req.title());
        if (req.description() != null) step.setDescription(req.description());
        if (req.borderColor() != null) step.setBorderColor(req.borderColor());
        if (req.titleColor()  != null) step.setTitleColor(req.titleColor());
        return journeyRepository.save(step);
    }
}

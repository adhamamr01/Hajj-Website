package com.hajj.backend.service;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.repository.JourneyRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

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

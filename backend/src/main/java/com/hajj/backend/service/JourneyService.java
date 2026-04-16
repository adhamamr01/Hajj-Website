package com.hajj.backend.service;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.repository.JourneyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JourneyService {

    private final JourneyRepository journeyRepository;

    @Cacheable("journey")
    public List<JourneyStep> findAllOrdered() {
        return journeyRepository.findAllByOrderByStepNumberAsc();
    }
}

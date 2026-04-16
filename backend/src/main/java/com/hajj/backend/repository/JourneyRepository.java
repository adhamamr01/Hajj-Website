package com.hajj.backend.repository;

import com.hajj.backend.model.JourneyStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JourneyRepository extends JpaRepository<JourneyStep, Long> {
    List<JourneyStep> findAllByOrderByStepNumberAsc();
}

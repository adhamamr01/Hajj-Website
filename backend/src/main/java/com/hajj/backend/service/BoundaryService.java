package com.hajj.backend.service;

import com.hajj.backend.model.BoundaryPoint;
import com.hajj.backend.model.HaramBoundary;
import com.hajj.backend.repository.BoundaryPointRepository;
import com.hajj.backend.repository.HaramBoundaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoundaryService {

    private final HaramBoundaryRepository haramBoundaryRepository;
    private final BoundaryPointRepository boundaryPointRepository;

    @Cacheable("boundaries")
    public List<HaramBoundary> findAllBoundaries() {
        return haramBoundaryRepository.findAll();
    }

    @Cacheable("boundaryPoints")
    public List<BoundaryPoint> findAllBoundaryPoints() {
        return boundaryPointRepository.findAllByOrderByOrderIndexAsc();
    }
}

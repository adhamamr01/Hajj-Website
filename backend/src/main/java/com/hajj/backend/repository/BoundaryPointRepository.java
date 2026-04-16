package com.hajj.backend.repository;

import com.hajj.backend.model.BoundaryPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoundaryPointRepository extends JpaRepository<BoundaryPoint, Long> {
    List<BoundaryPoint> findAllByOrderByOrderIndexAsc();
}

package com.hajj.backend.controller;

import com.hajj.backend.model.BoundaryPoint;
import com.hajj.backend.model.HaramBoundary;
import com.hajj.backend.service.BoundaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boundary")
@RequiredArgsConstructor
public class BoundaryController {

    private final BoundaryService boundaryService;

    @GetMapping
    public List<HaramBoundary> getBoundaries() {
        return boundaryService.findAllBoundaries();
    }

    @GetMapping("/points")
    public List<BoundaryPoint> getBoundaryPoints() {
        return boundaryService.findAllBoundaryPoints();
    }
}

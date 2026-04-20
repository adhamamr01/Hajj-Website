package com.hajj.backend.controller;

import com.hajj.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public endpoint called by the frontend on every route change.
 * No auth required — it only writes, never exposes data.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Records a page view.
     * Expected body: { "page": "/map-route", "sessionId": "<uuid>" }
     */
    @PostMapping("/view")
    public ResponseEntity<Void> recordView(@RequestBody Map<String, String> body) {
        String page      = body.getOrDefault("page", "unknown");
        String sessionId = body.get("sessionId");
        analyticsService.record(page, sessionId);
        return ResponseEntity.ok().build();
    }
}

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
        String page      = truncate(body.getOrDefault("page", "unknown"), 100);
        String sessionId = truncate(body.get("sessionId"), 36);
        analyticsService.record(page, sessionId);
        return ResponseEntity.ok().build();
    }

    /** Silently truncates a string to maxLen characters. Handles null safely. */
    private static String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }
}

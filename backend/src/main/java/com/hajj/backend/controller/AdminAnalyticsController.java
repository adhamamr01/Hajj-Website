package com.hajj.backend.controller;

import com.hajj.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for querying page view analytics.
 * All endpoints require the X-Admin-Key header.
 *
 * GET /api/admin/analytics/summary?days=30
 *   — total views and unique sessions per page for the last N days.
 *     Pass days=0 for all-time stats.
 *
 * GET /api/admin/analytics/trend?days=30
 *   — daily view counts for the last N days (useful for a traffic chart).
 */
@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(
            @RequestHeader("X-Admin-Key") String key,
            @RequestParam(defaultValue = "30") int days) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(analyticsService.summary(days));
    }

    @GetMapping("/trend")
    public ResponseEntity<?> trend(
            @RequestHeader("X-Admin-Key") String key,
            @RequestParam(defaultValue = "30") int days) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(analyticsService.dailyTrend(days));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing admin key"));
    }
}

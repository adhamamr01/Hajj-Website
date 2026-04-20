package com.hajj.backend.controller;

import com.hajj.backend.dto.UpdateJourneyStepRequest;
import com.hajj.backend.dto.UpdateMeeqatPointRequest;
import com.hajj.backend.service.JourneyService;
import com.hajj.backend.service.MeeqatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for editing site content without a code deploy.
 * All endpoints require the X-Admin-Key header.
 *
 * PUT /api/admin/content/journey/{id}
 *   — updates text fields on a journey step; evicts the journey cache.
 *
 * PUT /api/admin/content/meeqat/{id}
 *   — updates text fields on a Meeqat point; evicts the meeqat cache.
 *
 * Null fields in the request body are ignored — send only what you want to change.
 * Structural fields (lat, lng, stepNumber, id) cannot be changed here.
 */
@RestController
@RequestMapping("/api/admin/content")
public class AdminContentController {

    private final JourneyService journeyService;
    private final MeeqatService  meeqatService;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminContentController(JourneyService journeyService, MeeqatService meeqatService) {
        this.journeyService = journeyService;
        this.meeqatService  = meeqatService;
    }

    @PutMapping("/journey/{id}")
    public ResponseEntity<?> updateJourneyStep(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id,
            @Valid @RequestBody UpdateJourneyStepRequest req) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(journeyService.update(id, req));
    }

    @PutMapping("/meeqat/{id}")
    public ResponseEntity<?> updateMeeqatPoint(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable String id,
            @Valid @RequestBody UpdateMeeqatPointRequest req) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(meeqatService.update(id, req));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing admin key"));
    }
}

package com.hajj.backend.controller;

import com.hajj.backend.dto.AdminLink;
import com.hajj.backend.model.PageLink;
import com.hajj.backend.service.PageLinkService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin endpoints for the secret page links. Both require the X-Admin-Key header.
 *
 *   GET  /api/admin/links                      — list active links (with tokens)
 *   POST /api/admin/links/{type}/{key}/reset   — revoke the active link, return the new one
 *
 * Only type PAGE exists for now; ARTICLE is reserved for a later phase.
 */
@RestController
@RequestMapping("/api/admin/links")
public class AdminLinksController {

    private final PageLinkService pageLinkService;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminLinksController(PageLinkService pageLinkService) {
        this.pageLinkService = pageLinkService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (!adminApiKey.equals(key)) return unauthorized();

        List<AdminLink> links = pageLinkService.listActive().stream().map(AdminLinksController::toDto).toList();
        return ResponseEntity.ok(links);
    }

    @PostMapping("/{type}/{key}/reset")
    public ResponseEntity<?> reset(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String type,
            @PathVariable String key) {
        if (!adminApiKey.equals(adminKey)) return unauthorized();

        if (!"PAGE".equalsIgnoreCase(type)) return notFound();
        return pageLinkService.resetPage(key)
                .<ResponseEntity<?>>map(l -> ResponseEntity.ok(toDto(l)))
                .orElseGet(AdminLinksController::notFound);
    }

    private static AdminLink toDto(PageLink l) {
        return new AdminLink(l.getTargetType().name(), l.getTargetKey(), l.getToken(), l.getCreatedAt());
    }

    private static ResponseEntity<?> notFound() {
        return ResponseEntity.status(404).body(Map.of("error", "Unknown link target"));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing admin key"));
    }
}

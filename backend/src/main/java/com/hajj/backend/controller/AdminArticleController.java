package com.hajj.backend.controller;

import com.hajj.backend.dto.ArticleRequest;
import com.hajj.backend.service.ArticleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for articles. All require the X-Admin-Key header.
 *
 *   GET    /api/admin/articles                 — list (no bodies, includes active link token)
 *   GET    /api/admin/articles/{id}            — one article, full
 *   POST   /api/admin/articles                 — create a draft (all fields optional)
 *   PUT    /api/admin/articles/{id}            — partial update (null fields are ignored)
 *   DELETE /api/admin/articles/{id}            — delete and revoke its link
 *   POST   /api/admin/articles/{id}/publish    — 400 unless title/summary/body exist in both languages
 *   POST   /api/admin/articles/{id}/unpublish  — back to DRAFT, link kept
 */
@RestController
@RequestMapping("/api/admin/articles")
public class AdminArticleController {

    private final ArticleService articleService;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(articleService.adminList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(articleService.adminGet(id));
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @Valid @RequestBody ArticleRequest req) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.status(201).body(articleService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id,
            @Valid @RequestBody ArticleRequest req) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(articleService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        if (!adminApiKey.equals(key)) return unauthorized();
        articleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publish(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(articleService.publish(id));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<?> unpublish(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        if (!adminApiKey.equals(key)) return unauthorized();
        return ResponseEntity.ok(articleService.unpublish(id));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or missing admin key"));
    }
}

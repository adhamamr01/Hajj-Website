package com.hajj.backend.controller;

import com.hajj.backend.dto.PublicArticle;
import com.hajj.backend.dto.PublicArticleSummary;
import com.hajj.backend.service.ArticleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public, read-only article endpoints (published articles only).
 * In link-only mode LinkOnlyInterceptor allows GET /api/articles/{id} only with
 * that article's token, and 404s the list.
 */
@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public List<PublicArticleSummary> list() {
        return articleService.findPublished();
    }

    @GetMapping("/{id}")
    public PublicArticle get(@PathVariable Long id) {
        return articleService.findPublished(id);
    }
}

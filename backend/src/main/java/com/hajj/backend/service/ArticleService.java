package com.hajj.backend.service;

import com.hajj.backend.dto.*;
import com.hajj.backend.model.Article;
import com.hajj.backend.model.Article.Status;
import com.hajj.backend.model.PageLink;
import com.hajj.backend.repository.ArticleRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bilingual articles: public reads (cached, published only) and admin writes
 * (each evicts both article caches). Admin reads are never cached.
 *
 * Cache config (name, TTL, max size) lives in CacheManagerConfig.
 */
@Service
public class ArticleService {

    private final ArticleRepository repo;
    private final PageLinkService pageLinkService;

    public ArticleService(ArticleRepository repo, PageLinkService pageLinkService) {
        this.repo = repo;
        this.pageLinkService = pageLinkService;
    }

    // ── Public (published only, cached) ───────────────────────────────────

    @Cacheable("articleList")
    public List<PublicArticleSummary> findPublished() {
        return repo.findAllByStatusOrderByPublishedAtDescIdDesc(Status.PUBLISHED).stream()
                .map(a -> new PublicArticleSummary(a.getId(), a.getTitleEn(), a.getTitleAr(),
                        a.getSummaryEn(), a.getSummaryAr(), a.getPublishedAt()))
                .toList();
    }

    /** A published article; 404 for drafts and unknown ids (never cached, as it throws). */
    @Cacheable("article")
    public PublicArticle findPublished(Long id) {
        Article a = repo.findByIdAndStatus(id, Status.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        return new PublicArticle(a.getId(), a.getTitleEn(), a.getTitleAr(), a.getSummaryEn(), a.getSummaryAr(),
                a.getBodyEn(), a.getBodyAr(), a.getPublishedAt());
    }

    // ── Admin reads ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminArticleSummary> adminList() {
        Map<Long, String> tokens = pageLinkService.activeArticleTokens();
        return repo.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(a -> new AdminArticleSummary(a.getId(), a.getTitleEn(), a.getTitleAr(), a.getStatus().name(),
                        a.getCreatedAt(), a.getUpdatedAt(), a.getPublishedAt(), tokens.get(a.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminArticle adminGet(Long id) {
        return toAdmin(find(id));
    }

    // ── Admin writes ──────────────────────────────────────────────────────

    @CacheEvict(value = {"articleList", "article"}, allEntries = true)
    @Transactional
    public AdminArticle create(ArticleRequest req) {
        Article a = new Article();
        apply(a, req);
        return toAdmin(repo.save(a));
    }

    /** Null fields in the request are ignored — only non-null values are applied. */
    @CacheEvict(value = {"articleList", "article"}, allEntries = true)
    @Transactional
    public AdminArticle update(Long id, ArticleRequest req) {
        Article a = find(id);
        apply(a, req);
        return toAdmin(repo.save(a));
    }

    /** Deletes the article and revokes its secret link. */
    @CacheEvict(value = {"articleList", "article"}, allEntries = true)
    @Transactional
    public void delete(Long id) {
        Article a = find(id);
        pageLinkService.revokeArticleLink(id);
        repo.delete(a);
    }

    /**
     * Publishes the article (400 listing every missing field unless title, summary
     * and body are non-blank in both languages) and makes sure it has a secret link.
     */
    @CacheEvict(value = {"articleList", "article"}, allEntries = true)
    @Transactional
    public AdminArticle publish(Long id) {
        Article a = find(id);
        List<String> missing = missingForPublish(a);
        if (!missing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot publish: missing " + String.join(", ", missing));
        }
        a.setStatus(Status.PUBLISHED);
        // Keep the first publish date when republishing after an unpublish.
        if (a.getPublishedAt() == null) a.setPublishedAt(Instant.now());
        repo.save(a);
        pageLinkService.ensureArticleLink(id);
        return toAdmin(a);
    }

    /** Back to DRAFT. The secret link is kept so republishing reuses it. */
    @CacheEvict(value = {"articleList", "article"}, allEntries = true)
    @Transactional
    public AdminArticle unpublish(Long id) {
        Article a = find(id);
        a.setStatus(Status.DRAFT);
        return toAdmin(repo.save(a));
    }

    /** Replaces a published article's secret link; 404 for unknown or unpublished articles. */
    @Transactional
    public PageLink resetLink(Long id) {
        repo.findByIdAndStatus(id, Status.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown link target"));
        return pageLinkService.resetArticleLink(id);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private Article find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + id));
    }

    private static void apply(Article a, ArticleRequest r) {
        if (r.titleEn()   != null) a.setTitleEn(r.titleEn());
        if (r.titleAr()   != null) a.setTitleAr(r.titleAr());
        if (r.summaryEn() != null) a.setSummaryEn(r.summaryEn());
        if (r.summaryAr() != null) a.setSummaryAr(r.summaryAr());
        if (r.bodyEn()    != null) a.setBodyEn(r.bodyEn());
        if (r.bodyAr()    != null) a.setBodyAr(r.bodyAr());
    }

    private static List<String> missingForPublish(Article a) {
        List<String> missing = new ArrayList<>();
        if (blank(a.getTitleEn()))   missing.add("English title");
        if (blank(a.getSummaryEn())) missing.add("English summary");
        if (blank(a.getBodyEn()))    missing.add("English body");
        if (blank(a.getTitleAr()))   missing.add("Arabic title");
        if (blank(a.getSummaryAr())) missing.add("Arabic summary");
        if (blank(a.getBodyAr()))    missing.add("Arabic body");
        return missing;
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }

    private AdminArticle toAdmin(Article a) {
        String token = pageLinkService.findArticleLink(a.getId()).map(PageLink::getToken).orElse(null);
        return new AdminArticle(a.getId(), a.getTitleEn(), a.getTitleAr(), a.getSummaryEn(), a.getSummaryAr(),
                a.getBodyEn(), a.getBodyAr(), a.getStatus().name(),
                a.getCreatedAt(), a.getUpdatedAt(), a.getPublishedAt(), token);
    }
}

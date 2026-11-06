package com.hajj.backend;

import com.hajj.backend.dto.AdminArticle;
import com.hajj.backend.dto.ArticleRequest;
import com.hajj.backend.filter.RateLimitFilter;
import com.hajj.backend.service.ArticleService;
import com.hajj.backend.service.PageLinkService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Article gating with link-only mode ON: an article is readable only with its own
 * token, the list does not exist, and admin stays reachable.
 */
@SpringBootTest
@TestPropertySource(properties = {"app.admin.api-key=test-admin-key", "site.link-only=true"})
class ArticleLinkOnlyIntegrationTest {

    private static final AtomicInteger NEXT_IP = new AtomicInteger();

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;
    @Autowired ArticleService articleService;
    @Autowired PageLinkService pageLinkService;
    MockMvc mvc;
    final List<Long> created = new ArrayList<>();

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .addFilters(rateLimitFilter)
                .defaultRequest(get("/").with(freshClientIp()))
                .build();
    }

    @AfterEach
    void cleanUp() {
        created.forEach(articleService::delete);
    }

    private static RequestPostProcessor freshClientIp() {
        return request -> {
            request.addHeader("X-Forwarded-For", "10.96.0." + NEXT_IP.incrementAndGet());
            return request;
        };
    }

    private AdminArticle publishedArticle(String title) {
        AdminArticle a = articleService.create(new ArticleRequest(title, "عنوان", "Summary", "ملخص", "Body", "نص"));
        created.add(a.id());
        return articleService.publish(a.id());
    }

    private String pageToken(String key) {
        return pageLinkService.listActive().stream()
                .filter(l -> l.getTargetKey().equals(key)).findFirst().orElseThrow().getToken();
    }

    @Test
    void ownToken_returnsTheArticle() throws Exception {
        AdminArticle a = publishedArticle("Mine");
        mvc.perform(get("/api/articles/" + a.id()).header("X-Page-Token", a.linkToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titleEn").value("Mine"))
                .andExpect(header().string("X-Robots-Tag", "noindex, nofollow"));
    }

    @Test
    void anotherArticlesToken_returns404() throws Exception {
        AdminArticle a = publishedArticle("A");
        AdminArticle b = publishedArticle("B");
        mvc.perform(get("/api/articles/" + a.id()).header("X-Page-Token", b.linkToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void pageTokenOrNoToken_returns404() throws Exception {
        AdminArticle a = publishedArticle("A");
        mvc.perform(get("/api/articles/" + a.id()).header("X-Page-Token", pageToken("journey")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/" + a.id())).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/" + a.id()).header("X-Page-Token", "bogus")).andExpect(status().isNotFound());
    }

    @Test
    void articleList_isNotAvailable_evenWithATokenOrAKnownArticle() throws Exception {
        AdminArticle a = publishedArticle("A");
        mvc.perform(get("/api/articles")).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles").header("X-Page-Token", a.linkToken())).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles").header("X-Page-Token", pageToken("home"))).andExpect(status().isNotFound());
    }

    @Test
    void articleToken_doesNotOpenPageContent() throws Exception {
        AdminArticle a = publishedArticle("A");
        mvc.perform(get("/api/journey").header("X-Page-Token", a.linkToken())).andExpect(status().isNotFound());
    }

    @Test
    void unpublishedArticle_withItsKeptToken_returns404() throws Exception {
        AdminArticle a = publishedArticle("A");
        articleService.unpublish(a.id());
        mvc.perform(get("/api/articles/" + a.id()).header("X-Page-Token", a.linkToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void articleLinkResolves_andAdminStaysReachable() throws Exception {
        AdminArticle a = publishedArticle("A");
        mvc.perform(get("/api/links/" + a.linkToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ARTICLE"));
        mvc.perform(get("/api/admin/articles").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk());
    }
}

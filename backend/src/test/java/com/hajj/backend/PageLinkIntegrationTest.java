package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import com.hajj.backend.service.PageLinkService;
import com.jayway.jsonpath.JsonPath;
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

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Secret page links with link-only mode OFF (the default): link resolution,
 * admin list/reset, and proof that content endpoints are not gated.
 *
 * Rate limits: RateLimitFilter keys its windows by the last X-Forwarded-For
 * entry, and its Spring context is shared with ApiIntegrationTest (same
 * properties), so every request here carries a fresh fake client IP. That way
 * these tests neither consume nor are throttled by the 10/min admin budget.
 */
@SpringBootTest
@TestPropertySource(properties = "app.admin.api-key=test-admin-key")
class PageLinkIntegrationTest {

    private static final AtomicInteger NEXT_IP = new AtomicInteger();

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;
    @Autowired PageLinkService pageLinkService;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .addFilters(rateLimitFilter)
                .defaultRequest(get("/").with(freshClientIp()))
                .build();
    }

    /** Each request looks like it comes from a different client. */
    private static RequestPostProcessor freshClientIp() {
        return request -> {
            request.addHeader("X-Forwarded-For", "10.99.0." + NEXT_IP.incrementAndGet());
            return request;
        };
    }

    private String activeToken(String pageKey) {
        return pageLinkService.listActive().stream()
                .filter(l -> l.getTargetKey().equals(pageKey))
                .findFirst().orElseThrow().getToken();
    }

    // ── Startup generation ────────────────────────────────────────────────

    @Test
    void everyPageHasAnActiveLink_with22CharUrlSafeToken() {
        for (String key : PageLinkService.PAGE_KEYS) {
            assertThat(activeToken(key)).matches("[A-Za-z0-9_-]{22}");
        }
    }

    // ── Resolution ────────────────────────────────────────────────────────

    @Test
    void activeToken_resolvesToItsPage() throws Exception {
        mvc.perform(get("/api/links/" + activeToken("journey")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PAGE"))
                .andExpect(jsonPath("$.key").value("journey"))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void unknownToken_returns404() throws Exception {
        mvc.perform(get("/api/links/not-a-real-token"))
                .andExpect(status().isNotFound());
    }

    @Test
    void overlongToken_returns404() throws Exception {
        mvc.perform(get("/api/links/" + "x".repeat(200)))
                .andExpect(status().isNotFound());
    }

    // ── Admin: list and reset ─────────────────────────────────────────────

    @Test
    void adminLinks_requiresKey() throws Exception {
        mvc.perform(get("/api/admin/links")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/links/PAGE/journey/reset")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminLinks_listsOneActiveLinkPerPage() throws Exception {
        mvc.perform(get("/api/admin/links").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(PageLinkService.PAGE_KEYS.size()))
                .andExpect(jsonPath("$[?(@.key == 'meeqat')].type").value("PAGE"))
                .andExpect(jsonPath("$[?(@.key == 'meeqat')].token").value(activeToken("meeqat")))
                .andExpect(jsonPath("$[?(@.key == 'meeqat')].createdAt").isNotEmpty());
    }

    @Test
    void reset_revokesOldTokenAndIssuesNewOne() throws Exception {
        String oldToken = activeToken("boundaries");

        String body = mvc.perform(post("/api/admin/links/PAGE/boundaries/reset")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("boundaries"))
                .andReturn().getResponse().getContentAsString();
        String newToken = JsonPath.read(body, "$.token");

        assertThat(newToken).isNotEqualTo(oldToken).matches("[A-Za-z0-9_-]{22}");
        mvc.perform(get("/api/links/" + oldToken)).andExpect(status().isNotFound());
        mvc.perform(get("/api/links/" + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("boundaries"));
        // Still exactly one active link per page.
        assertThat(pageLinkService.listActive()).hasSize(PageLinkService.PAGE_KEYS.size());
    }

    @Test
    void reset_unknownPageOrType_returns404() throws Exception {
        mvc.perform(post("/api/admin/links/PAGE/nope/reset").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/admin/links/ARTICLE/journey/reset").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isNotFound());
    }

    // ── Link-only is off by default: nothing is gated ─────────────────────

    @Test
    void contentEndpoints_areOpenWithoutToken_andHaveNoRobotsHeader() throws Exception {
        for (String path : new String[] {"/api/journey", "/api/meeqat", "/api/boundary", "/api/boundary/points"}) {
            mvc.perform(get(path))
                    .andExpect(status().isOk())
                    .andExpect(header().doesNotExist("X-Robots-Tag"));
        }
    }
}

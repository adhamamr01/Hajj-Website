package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import com.hajj.backend.service.PageLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Server-side enforcement of link-only mode (site.link-only=true). This class
 * has its own Spring context (different properties), so its rate-limit windows
 * are independent of the other integration tests; fresh client IPs are still
 * used so no test depends on how many requests the others made.
 */
@SpringBootTest
@TestPropertySource(properties = {"app.admin.api-key=test-admin-key", "site.link-only=true"})
class LinkOnlyIntegrationTest {

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

    private static RequestPostProcessor freshClientIp() {
        return request -> {
            request.addHeader("X-Forwarded-For", "10.98.0." + NEXT_IP.incrementAndGet());
            return request;
        };
    }

    private String activeToken(String pageKey) {
        return pageLinkService.listActive().stream()
                .filter(l -> l.getTargetKey().equals(pageKey))
                .findFirst().orElseThrow().getToken();
    }

    @Test
    void contentWithoutToken_returns404() throws Exception {
        for (String path : new String[] {"/api/journey", "/api/meeqat", "/api/meeqat/dhul-hulayfah",
                                         "/api/boundary", "/api/boundary/points"}) {
            mvc.perform(get(path)).andExpect(status().isNotFound());
        }
    }

    @Test
    void contentWithUnknownToken_returns404() throws Exception {
        mvc.perform(get("/api/journey").header("X-Page-Token", "bogus"))
                .andExpect(status().isNotFound());
    }

    @Test
    void contentWithOtherPagesToken_returns404() throws Exception {
        mvc.perform(get("/api/journey").header("X-Page-Token", activeToken("meeqat")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/meeqat").header("X-Page-Token", activeToken("boundaries")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/boundary").header("X-Page-Token", activeToken("journey")))
                .andExpect(status().isNotFound());
        // The home page uses no content data, so its token unlocks none.
        mvc.perform(get("/api/journey").header("X-Page-Token", activeToken("home")))
                .andExpect(status().isNotFound());
    }

    @Test
    void contentWithRightToken_returns200() throws Exception {
        mvc.perform(get("/api/journey").header("X-Page-Token", activeToken("journey")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Intention & Preparation"));
        mvc.perform(get("/api/meeqat").header("X-Page-Token", activeToken("meeqat")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/meeqat/dhul-hulayfah").header("X-Page-Token", activeToken("meeqat")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/boundary").header("X-Page-Token", activeToken("boundaries")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/boundary/points").header("X-Page-Token", activeToken("boundaries")))
                .andExpect(status().isOk());
    }

    @Test
    void revokedToken_stopsUnlockingContent() throws Exception {
        String old = activeToken("journey");
        mvc.perform(post("/api/admin/links/PAGE/journey/reset").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/journey").header("X-Page-Token", old)).andExpect(status().isNotFound());
        mvc.perform(get("/api/journey").header("X-Page-Token", activeToken("journey")))
                .andExpect(status().isOk());
    }

    @Test
    void linkResolutionAnalyticsAndAdmin_stayReachableWithoutToken() throws Exception {
        mvc.perform(get("/api/links/" + activeToken("home")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("home"));
        mvc.perform(post("/api/analytics/view")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"page\":\"journey\",\"sessionId\":\"test-session\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/admin/links").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk());
    }

    @Test
    void apiResponses_carryNoindexHeader() throws Exception {
        mvc.perform(get("/api/journey")).andExpect(header().string("X-Robots-Tag", "noindex, nofollow"));
        mvc.perform(get("/api/links/whatever")).andExpect(header().string("X-Robots-Tag", "noindex, nofollow"));
    }

    @Test
    void corsPreflightWithTokenHeader_isAllowed() throws Exception {
        mvc.perform(options("/api/journey")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "x-page-token"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Headers"));
    }

    @Test
    void gatedNotFound_stillCarriesCorsHeaders() throws Exception {
        mvc.perform(get("/api/journey").header("Origin", "http://localhost:5173"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}

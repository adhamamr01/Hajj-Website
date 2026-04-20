package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full-stack regression tests that boot the real application and exercise
 * the complete request path: Spring Security → RateLimitFilter → Controller.
 *
 * These tests catch regressions that unit tests cannot:
 *   - Security config changes (wrong path accidentally blocked/permitted)
 *   - RateLimitFilter allowlist (new endpoint missing from api_config)
 *   - Admin auth check (X-Admin-Key wiring)
 *   - GlobalExceptionHandler response shape
 *   - Input validation (@Valid + @Size)
 *
 * Requires a running PostgreSQL instance (provided by the CI service container,
 * or docker compose locally).
 */
@SpringBootTest
@TestPropertySource(properties = "app.admin.api-key=test-admin-key")
class ApiIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .addFilters(rateLimitFilter)
                .build();
    }

    // ── Public endpoints ──────────────────────────────────────────────────

    @Test
    void meeqat_returns200WithData() throws Exception {
        mvc.perform(get("/api/meeqat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("dhul-hulayfah"));
    }

    @Test
    void journey_returns200WithData() throws Exception {
        mvc.perform(get("/api/journey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Intention & Preparation"));
    }

    @Test
    void boundary_returns200() throws Exception {
        mvc.perform(get("/api/boundary"))
                .andExpect(status().isOk());
    }

    @Test
    void analytics_post_returns200() throws Exception {
        mvc.perform(post("/api/analytics/view")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"page\":\"/journey\",\"sessionId\":\"test-session\"}"))
                .andExpect(status().isOk());
    }

    // ── Allowlist (RateLimitFilter) ───────────────────────────────────────

    @Test
    void unregisteredApiPath_returns404() throws Exception {
        mvc.perform(get("/api/unknown-endpoint"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    // ── Spring Security ───────────────────────────────────────────────────

    @Test
    void nonApiPath_returns403() throws Exception {
        mvc.perform(get("/some-other-path"))
                .andExpect(status().isForbidden());
    }

    @Test
    void actuatorHealth_returns200() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void actuatorEnv_returns403() throws Exception {
        mvc.perform(get("/actuator/env"))
                .andExpect(status().isForbidden());
    }

    // ── Admin auth ────────────────────────────────────────────────────────

    @Test
    void adminEndpoint_withoutKey_returns401() throws Exception {
        mvc.perform(get("/api/admin/cache"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_withWrongKey_returns401() throws Exception {
        mvc.perform(get("/api/admin/cache")
                        .header("X-Admin-Key", "wrong-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_withCorrectKey_returns200() throws Exception {
        mvc.perform(get("/api/admin/cache")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk());
    }

    // ── Input validation ──────────────────────────────────────────────────

    @Test
    void adminContentUpdate_withOversizedField_returns400() throws Exception {
        String oversizedTitle = "x".repeat(300); // exceeds @Size(max=255)
        mvc.perform(put("/api/admin/content/journey/1")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + oversizedTitle + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}

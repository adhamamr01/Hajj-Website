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
import com.jayway.jsonpath.JsonPath;
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
                // findAll() has no ORDER BY, so row order shifts after any UPDATE — match by id.
                .andExpect(jsonPath("$[?(@.id == 'dhul-hulayfah')]").exists());
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

    // ── Arabic content (V3 migration) ─────────────────────────────────────

    @Test
    void meeqat_includesArabicFields() throws Exception {
        mvc.perform(get("/api/meeqat/dhul-hulayfah"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameAr").value("ذو الحليفة (أبيار علي)"))
                .andExpect(jsonPath("$.directionAr").value("الشمال"))
                .andExpect(jsonPath("$.forPilgrimsAr").value("أهل المدينة ومن مر بها من الجهة الشمالية"))
                .andExpect(jsonPath("$.distanceAr").value("نحو 450 كم"))
                .andExpect(jsonPath("$.modernAr").isNotEmpty())
                .andExpect(jsonPath("$.descriptionAr").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Dhul-Hulayfah (Abyar Ali)"));
    }

    @Test
    void journey_includesArabicFields() throws Exception {
        mvc.perform(get("/api/journey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titleAr").value("النية والاستعداد"))
                .andExpect(jsonPath("$[0].descriptionAr").isNotEmpty())
                .andExpect(jsonPath("$[6].titleAr").value("طواف الوداع"));
    }

    @Test
    void boundary_includesArabicFields() throws Exception {
        mvc.perform(get("/api/boundary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nameAr").value("المسجد الحرام"))
                .andExpect(jsonPath("$[0].descriptionAr").isNotEmpty());
    }

    @Test
    void boundaryPoints_haveEnglishNameAndArabicNameAr() throws Exception {
        mvc.perform(get("/api/boundary/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Idhat Liban"))
                .andExpect(jsonPath("$[0].nameAr").value("إضاء لبن"))
                .andExpect(jsonPath("$[4].nameAr").value("التنعيم"));
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

    // ── Arabic partial updates ────────────────────────────────────────────

    @Test
    void journeyUpdate_onlyArabicField_leavesEnglishUntouched() throws Exception {
        String list = mvc.perform(get("/api/journey")).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(list, "$[0].id");
        String originalTitleAr = JsonPath.read(list, "$[0].titleAr");

        try {
            mvc.perform(put("/api/admin/content/journey/" + id)
                            .header("X-Admin-Key", "test-admin-key")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"titleAr\":\"عنوان تجريبي\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.titleAr").value("عنوان تجريبي"))
                    .andExpect(jsonPath("$.title").value("Intention & Preparation"))
                    .andExpect(jsonPath("$.descriptionAr").isNotEmpty());
        } finally {
            mvc.perform(put("/api/admin/content/journey/" + id)
                    .header("X-Admin-Key", "test-admin-key")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"titleAr\":\"" + originalTitleAr + "\"}"));
        }
    }

    @Test
    void meeqatUpdate_onlyArabicField_leavesEnglishUntouched() throws Exception {
        try {
            mvc.perform(put("/api/admin/content/meeqat/dhul-hulayfah")
                            .header("X-Admin-Key", "test-admin-key")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"distanceAr\":\"نحو 451 كم\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.distanceAr").value("نحو 451 كم"))
                    .andExpect(jsonPath("$.distance").value("~450 km"))
                    .andExpect(jsonPath("$.nameAr").value("ذو الحليفة (أبيار علي)"));
        } finally {
            mvc.perform(put("/api/admin/content/meeqat/dhul-hulayfah")
                    .header("X-Admin-Key", "test-admin-key")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"distanceAr\":\"نحو 450 كم\"}"));
        }
    }
}

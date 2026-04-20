package com.hajj.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

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
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "app.admin.api-key=test-admin-key")
class ApiIntegrationTest {

    @LocalServerPort int port;
    @Autowired TestRestTemplate rest;

    // ── Public endpoints ──────────────────────────────────────────────────

    @Test
    void meeqat_returns200WithData() {
        ResponseEntity<String> res = rest.getForEntity(url("/api/meeqat"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).contains("dhul-hulayfah");
    }

    @Test
    void journey_returns200WithData() {
        ResponseEntity<String> res = rest.getForEntity(url("/api/journey"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).contains("Intention");
    }

    @Test
    void boundary_returns200WithData() {
        ResponseEntity<String> res = rest.getForEntity(url("/api/boundary"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void analytics_post_returns200() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> req = new HttpEntity<>(
                "{\"page\":\"/journey\",\"sessionId\":\"test-session\"}", headers);

        ResponseEntity<Void> res = rest.postForEntity(url("/api/analytics/view"), req, Void.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ── Allowlist (RateLimitFilter) ───────────────────────────────────────

    @Test
    void unregisteredApiPath_returns404() {
        ResponseEntity<String> res = rest.getForEntity(url("/api/unknown-endpoint"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).contains("error");
    }

    // ── Spring Security ───────────────────────────────────────────────────

    @Test
    void nonApiPath_returns403() {
        ResponseEntity<String> res = rest.getForEntity(url("/some-other-path"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void actuatorHealth_returns200() {
        ResponseEntity<String> res = rest.getForEntity(url("/actuator/health"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void actuatorEnv_returns403() {
        ResponseEntity<String> res = rest.getForEntity(url("/actuator/env"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ── Admin auth ────────────────────────────────────────────────────────

    @Test
    void adminEndpoint_withoutKey_returns401() {
        ResponseEntity<String> res = rest.getForEntity(url("/api/admin/cache"), String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void adminEndpoint_withWrongKey_returns401() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Admin-Key", "wrong-key");
        HttpEntity<Void> req = new HttpEntity<>(headers);

        ResponseEntity<String> res = rest.exchange(
                url("/api/admin/cache"), HttpMethod.GET, req, String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void adminEndpoint_withCorrectKey_returns200() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Admin-Key", "test-admin-key");
        HttpEntity<Void> req = new HttpEntity<>(headers);

        ResponseEntity<String> res = rest.exchange(
                url("/api/admin/cache"), HttpMethod.GET, req, String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ── Input validation ──────────────────────────────────────────────────

    @Test
    void adminContentUpdate_withOversizedField_returns400() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Admin-Key", "test-admin-key");

        String oversizedTitle = "x".repeat(300); // exceeds @Size(max=255)
        HttpEntity<String> req = new HttpEntity<>(
                "{\"title\":\"" + oversizedTitle + "\"}", headers);

        ResponseEntity<String> res = rest.exchange(
                url("/api/admin/content/journey/1"), HttpMethod.PUT, req, String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).contains("error");
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}

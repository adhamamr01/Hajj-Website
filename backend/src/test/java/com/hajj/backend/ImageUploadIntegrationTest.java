package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import com.jayway.jsonpath.JsonPath;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Image upload with a local HttpServer standing in for the OCI bucket's PAR URL.
 *
 * Rate limits: every request carries a fresh fake client IP (see PageLinkIntegrationTest)
 * so these tests neither consume nor are throttled by the shared 30/min admin budget.
 */
@SpringBootTest
@TestPropertySource(properties = "app.admin.api-key=test-admin-key")
class ImageUploadIntegrationTest {

    private static final AtomicInteger NEXT_IP = new AtomicInteger();
    private static final AtomicReference<Integer> fakeStatus = new AtomicReference<>(200);
    private static final List<Received> received = new CopyOnWriteArrayList<>();
    private static final HttpServer fakeBucket = startFakeBucket();
    private static final String BASE = "http://127.0.0.1:" + fakeBucket.getAddress().getPort();

    record Received(String method, String path, String contentType, String cacheControl, byte[] body) {}

    private static HttpServer startFakeBucket() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
            server.createContext("/", exchange -> {
                byte[] body = exchange.getRequestBody().readAllBytes();
                received.add(new Received(
                        exchange.getRequestMethod(),
                        exchange.getRequestURI().getPath(),
                        exchange.getRequestHeaders().getFirst("Content-Type"),
                        exchange.getRequestHeaders().getFirst("Cache-Control"),
                        body));
                exchange.sendResponseHeaders(fakeStatus.get(), -1);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void parUrl(DynamicPropertyRegistry registry) {
        registry.add("images.upload-par-url", () -> BASE + "/p/fake-secret/n/ns/b/bucket/o/");
    }

    @AfterAll
    static void stopFakeBucket() {
        fakeBucket.stop(0);
    }

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        received.clear();
        fakeStatus.set(200);
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

    private static byte[] jpeg() {
        return new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3};
    }

    private static byte[] png() {
        return new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 9, 9};
    }

    private static byte[] webp() {
        return new byte[] {'R', 'I', 'F', 'F', 4, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '};
    }

    // ── Success ───────────────────────────────────────────────────────────

    @Test
    void validWebp_isForwardedToTheBucket_andReturnsThePublicUrl() throws Exception {
        byte[] image = webp();

        String body = mvc.perform(post("/api/admin/images")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType("image/webp")
                        .content(image))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String url = JsonPath.read(body, "$.url");
        assertThat(url).matches(java.util.regex.Pattern.quote(BASE + "/n/ns/b/bucket/o/articles/")
                + "[0-9a-f-]{36}\\.webp");
        assertThat(url).doesNotContain("fake-secret");

        assertThat(received).hasSize(1);
        Received r = received.get(0);
        assertThat(r.method()).isEqualTo("PUT");
        assertThat(r.path()).isEqualTo("/p/fake-secret/n/ns/b/bucket/o/" + url.substring(url.indexOf("articles/")));
        assertThat(r.contentType()).isEqualTo("image/webp");
        assertThat(r.cacheControl()).isEqualTo("public, max-age=31536000, immutable");
        assertThat(r.body()).isEqualTo(image);
    }

    @Test
    void jpegAndPng_getTheirOwnExtensions() throws Exception {
        String jpg = mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/jpeg").content(jpeg()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String png = mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.IMAGE_PNG).content(png()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

        assertThat((String) JsonPath.read(jpg, "$.url")).endsWith(".jpg");
        assertThat((String) JsonPath.read(png, "$.url")).endsWith(".png");
    }

    // ── Authentication ────────────────────────────────────────────────────

    @Test
    void wrongOrMissingKey_is401_andNothingIsUploaded() throws Exception {
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "wrong")
                        .contentType("image/png").content(png()))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/images").contentType("image/png").content(png()))
                .andExpect(status().isUnauthorized());

        assertThat(received).isEmpty();
    }

    // ── Validation ────────────────────────────────────────────────────────

    @Test
    void unsupportedOrMissingType_is400() throws Exception {
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/gif").content(png()))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key").content(png()))
                .andExpect(status().isBadRequest());

        assertThat(received).isEmpty();
    }

    @Test
    void bytesThatDoNotMatchTheDeclaredType_are400() throws Exception {
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/jpeg").content(png()))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png").content("<svg onload=alert(1)>".getBytes()))
                .andExpect(status().isBadRequest());
        // RIFF but not WEBP (e.g. a WAV file)
        byte[] wav = {'R', 'I', 'F', 'F', 4, 0, 0, 0, 'W', 'A', 'V', 'E'};
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/webp").content(wav))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png").content(new byte[0]))
                .andExpect(status().isBadRequest());

        assertThat(received).isEmpty();
    }

    @Test
    void imageOverFiveMegabytes_is413() throws Exception {
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(png(), 0, big, 0, png().length);

        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png").content(big))
                .andExpect(status().isPayloadTooLarge());

        assertThat(received).isEmpty();
    }

    @Test
    void imageOfExactlyFiveMegabytes_isAccepted() throws Exception {
        byte[] max = new byte[5 * 1024 * 1024];
        System.arraycopy(png(), 0, max, 0, png().length);

        mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png").content(max))
                .andExpect(status().isCreated());
    }

    // ── Upstream failure ──────────────────────────────────────────────────

    @Test
    void bucketFailure_is502_withAGenericMessage() throws Exception {
        fakeStatus.set(500);

        String body = mvc.perform(post("/api/admin/images").header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png").content(png()))
                .andExpect(status().isBadGateway())
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain("fake-secret").doesNotContain(BASE);
    }
}

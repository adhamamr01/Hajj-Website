package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Image upload when no PAR URL is configured (the default): 503, after the key check. */
@SpringBootTest
@TestPropertySource(properties = {"app.admin.api-key=test-admin-key", "images.upload-par-url="})
class ImageUploadNotConfiguredIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;

    private MockMvc mvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .addFilters(rateLimitFilter)
                .build();
    }

    @Test
    void withoutAParUrl_uploadIs503_withAClearMessage() throws Exception {
        mvc().perform(post("/api/admin/images")
                        .header("X-Forwarded-For", "10.97.0.1")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType("image/png")
                        .content(new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Image uploads are not configured"));
    }

    @Test
    void withoutAParUrl_aWrongKeyIsStill401() throws Exception {
        mvc().perform(post("/api/admin/images")
                        .header("X-Forwarded-For", "10.97.0.2")
                        .header("X-Admin-Key", "wrong")
                        .contentType("image/png")
                        .content(new byte[] {1}))
                .andExpect(status().isUnauthorized());
    }
}

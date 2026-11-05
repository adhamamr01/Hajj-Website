package com.hajj.backend;

import com.hajj.backend.filter.RateLimitFilter;
import com.hajj.backend.service.ArticleService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Articles with link-only mode OFF: admin CRUD, publishing rules, secret links,
 * and the public endpoints.
 *
 * Like the other integration tests, every request carries a fresh fake client IP so
 * none of them consumes (or is throttled by) the 30/min admin budget. Articles
 * created here are deleted afterwards, so the shared database stays clean.
 */
@SpringBootTest
@TestPropertySource(properties = "app.admin.api-key=test-admin-key")
class ArticleIntegrationTest {

    private static final AtomicInteger NEXT_IP = new AtomicInteger();
    private static final String KEY = "test-admin-key";

    private static final String FULL = """
            {"titleEn":"On Ihram","titleAr":"عن الإحرام","summaryEn":"A short summary.","summaryAr":"ملخص قصير.",
             "bodyEn":"# Heading\\n\\nBody in English.","bodyAr":"نص عربي."}""";

    @Autowired WebApplicationContext context;
    @Autowired RateLimitFilter rateLimitFilter;
    @Autowired ArticleService articleService;
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
        for (Long id : created) {
            try {
                articleService.delete(id);
            } catch (ResponseStatusException alreadyGone) {
                // deleted by the test itself
            }
        }
    }

    private static RequestPostProcessor freshClientIp() {
        return request -> {
            request.addHeader("X-Forwarded-For", "10.97.0." + NEXT_IP.incrementAndGet());
            return request;
        };
    }

    private long create(String json) throws Exception {
        String body = mvc.perform(post("/api/admin/articles").header("X-Admin-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(body, "$.id")).longValue();
        created.add(id);
        return id;
    }

    private String publish(long id) throws Exception {
        String body = mvc.perform(post("/api/admin/articles/" + id + "/publish").header("X-Admin-Key", KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.linkToken");
    }

    // ── Auth ──────────────────────────────────────────────────────────────

    @Test
    void adminEndpoints_requireKey() throws Exception {
        mvc.perform(get("/api/admin/articles")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/articles/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/articles").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/admin/articles/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/articles/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/articles/1/publish")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/articles/1/unpublish")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/articles").header("X-Admin-Key", "wrong")).andExpect(status().isUnauthorized());
    }

    // ── CRUD ──────────────────────────────────────────────────────────────

    @Test
    void create_makesAPartialDraftWithoutALink() throws Exception {
        long id = create("{\"titleEn\":\"Only a title\"}");

        mvc.perform(get("/api/admin/articles/" + id).header("X-Admin-Key", KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.titleEn").value("Only a title"))
                .andExpect(jsonPath("$.titleAr").doesNotExist())
                .andExpect(jsonPath("$.publishedAt").doesNotExist())
                .andExpect(jsonPath("$.linkToken").doesNotExist())
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void update_isPartial_nullFieldsAreIgnored() throws Exception {
        long id = create(FULL);

        mvc.perform(put("/api/admin/articles/" + id).header("X-Admin-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titleEn\":\"New title\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titleEn").value("New title"))
                .andExpect(jsonPath("$.titleAr").value("عن الإحرام"))
                .andExpect(jsonPath("$.summaryEn").value("A short summary."))
                .andExpect(jsonPath("$.bodyAr").value("نص عربي."));
    }

    @Test
    void update_unknownArticle_returns404() throws Exception {
        mvc.perform(put("/api/admin/articles/999999999").header("X-Admin-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/articles/999999999").header("X-Admin-Key", KEY))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_hasNoBodies_andShowsTheActiveLinkToken() throws Exception {
        long draft = create("{\"titleEn\":\"Draft one\"}");
        long live = create(FULL);
        String token = publish(live);

        mvc.perform(get("/api/admin/articles").header("X-Admin-Key", KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + draft + ")].status").value("DRAFT"))
                .andExpect(jsonPath("$[?(@.id == " + draft + ")].linkToken").value(contains(nullValue())))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].status").value("PUBLISHED"))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].linkToken").value(token))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].titleAr").value("عن الإحرام"))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].bodyEn").isEmpty())
                .andExpect(jsonPath("$[?(@.id == " + live + ")].bodyAr").isEmpty());
    }

    // ── Validation ────────────────────────────────────────────────────────

    @Test
    void tooLongFields_return400() throws Exception {
        for (String json : new String[] {
                "{\"titleEn\":\"" + "x".repeat(201) + "\"}",
                "{\"titleAr\":\"" + "x".repeat(201) + "\"}",
                "{\"summaryEn\":\"" + "x".repeat(501) + "\"}",
                "{\"summaryAr\":\"" + "x".repeat(501) + "\"}",
                "{\"bodyEn\":\"" + "x".repeat(100_001) + "\"}",
                "{\"bodyAr\":\"" + "x".repeat(100_001) + "\"}"}) {
            mvc.perform(post("/api/admin/articles").header("X-Admin-Key", KEY)
                            .contentType(MediaType.APPLICATION_JSON).content(json))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").isNotEmpty());
        }
    }

    @Test
    void maximumLengths_areAccepted_andOneMoreIsRejectedOnUpdate() throws Exception {
        long id = create("{\"titleEn\":\"" + "x".repeat(200) + "\",\"summaryEn\":\"" + "y".repeat(500)
                + "\",\"bodyEn\":\"" + "z".repeat(100_000) + "\"}");
        mvc.perform(put("/api/admin/articles/" + id).header("X-Admin-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"bodyAr\":\"" + "z".repeat(100_001) + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Publish / unpublish ───────────────────────────────────────────────

    @Test
    void publish_withArabicMissing_returns400_listingEveryMissingField() throws Exception {
        long id = create("{\"titleEn\":\"T\",\"summaryEn\":\"S\",\"bodyEn\":\"B\",\"titleAr\":\"ع\",\"summaryAr\":\"   \"}");

        mvc.perform(post("/api/admin/articles/" + id + "/publish").header("X-Admin-Key", KEY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(allOf(
                        containsString("Arabic summary"),
                        containsString("Arabic body"),
                        not(containsString("Arabic title")),
                        not(containsString("English")))));

        mvc.perform(get("/api/articles/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/articles/" + id).header("X-Admin-Key", KEY))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.linkToken").doesNotExist());
    }

    @Test
    void publish_createsALink_thatResolvesToTheArticle() throws Exception {
        long id = create(FULL);
        String token = publish(id);

        assertThat(token).matches("[A-Za-z0-9_-]{22}");
        mvc.perform(get("/api/links/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ARTICLE"))
                .andExpect(jsonPath("$.key").value(String.valueOf(id)));
        mvc.perform(get("/api/admin/links").header("X-Admin-Key", KEY))
                .andExpect(jsonPath("$[?(@.type == 'ARTICLE' && @.key == '" + id + "')].token").value(token));
    }

    @Test
    void publishAgain_keepsTheSameLink() throws Exception {
        long id = create(FULL);
        String token = publish(id);
        assertThat(publish(id)).isEqualTo(token);
    }

    @Test
    void unpublish_keepsLinkButPublicGetIs404_andRepublishReusesIt() throws Exception {
        long id = create(FULL);
        String token = publish(id);
        String firstDate = JsonPath.read(mvc.perform(get("/api/articles/" + id))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.publishedAt");

        mvc.perform(post("/api/admin/articles/" + id + "/unpublish").header("X-Admin-Key", KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.publishedAt").value(firstDate))
                .andExpect(jsonPath("$.linkToken").value(token));

        mvc.perform(get("/api/articles/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/links/" + token)).andExpect(status().isOk());

        // Republishing reuses the link and keeps the first publish date
        assertThat(publish(id)).isEqualTo(token);
        mvc.perform(get("/api/articles/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishedAt").value(firstDate));
    }

    @Test
    void delete_removesTheArticleAndRevokesItsLink() throws Exception {
        long id = create(FULL);
        String token = publish(id);

        mvc.perform(delete("/api/admin/articles/" + id).header("X-Admin-Key", KEY))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/links/" + token)).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/articles/" + id).header("X-Admin-Key", KEY)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/admin/articles/" + id).header("X-Admin-Key", KEY)).andExpect(status().isNotFound());
    }

    // ── Admin link reset ──────────────────────────────────────────────────

    @Test
    void resetArticleLink_replacesTheToken() throws Exception {
        long id = create(FULL);
        String oldToken = publish(id);

        String body = mvc.perform(post("/api/admin/links/ARTICLE/" + id + "/reset").header("X-Admin-Key", KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ARTICLE"))
                .andExpect(jsonPath("$.key").value(String.valueOf(id)))
                .andReturn().getResponse().getContentAsString();
        String newToken = JsonPath.read(body, "$.token");

        assertThat(newToken).isNotEqualTo(oldToken);
        mvc.perform(get("/api/links/" + oldToken)).andExpect(status().isNotFound());
        mvc.perform(get("/api/links/" + newToken)).andExpect(status().isOk());
    }

    @Test
    void resetArticleLink_unknownOrUnpublishedOrMalformed_returns404() throws Exception {
        long draft = create("{\"titleEn\":\"Never published\"}");
        for (String key : new String[] {"999999999", String.valueOf(draft), "abc"}) {
            mvc.perform(post("/api/admin/links/ARTICLE/" + key + "/reset").header("X-Admin-Key", KEY))
                    .andExpect(status().isNotFound());
        }
    }

    // ── Public endpoints (normal mode) ────────────────────────────────────

    @Test
    void publicList_hasPublishedOnly_withoutBodiesOrTokens() throws Exception {
        long draft = create("{\"titleEn\":\"Hidden draft\"}");
        long live = create(FULL);
        publish(live);

        mvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + live + ")].titleEn").value("On Ihram"))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].summaryAr").value("ملخص قصير."))
                .andExpect(jsonPath("$[?(@.id == " + live + ")].publishedAt").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == " + live + ")].bodyEn").isEmpty())
                .andExpect(jsonPath("$[?(@.id == " + draft + ")]").isEmpty());
    }

    @Test
    void publicGet_returnsBothLanguages_andNeverStatusOrToken() throws Exception {
        long id = create(FULL);
        publish(id);

        mvc.perform(get("/api/articles/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titleEn").value("On Ihram"))
                .andExpect(jsonPath("$.bodyAr").value("نص عربي."))
                .andExpect(jsonPath("$.bodyEn").value("# Heading\n\nBody in English."))
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.linkToken").doesNotExist());
    }

    @Test
    void publicGet_ofDraftUnknownAndMalformedIds_returns404() throws Exception {
        long draft = create(FULL);
        mvc.perform(get("/api/articles/" + draft)).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/999999999")).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/abc")).andExpect(status().isNotFound());
    }

    @Test
    void editsAreVisiblePublicly_becauseWritesEvictTheCache() throws Exception {
        long id = create(FULL);
        publish(id);
        mvc.perform(get("/api/articles/" + id)).andExpect(jsonPath("$.titleEn").value("On Ihram"));
        mvc.perform(get("/api/articles")).andExpect(jsonPath("$[?(@.id == " + id + ")].titleEn").value("On Ihram"));

        mvc.perform(put("/api/admin/articles/" + id).header("X-Admin-Key", KEY)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titleEn\":\"Renamed\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/articles/" + id)).andExpect(jsonPath("$.titleEn").value("Renamed"));
        mvc.perform(get("/api/articles")).andExpect(jsonPath("$[?(@.id == " + id + ")].titleEn").value("Renamed"));
    }
}

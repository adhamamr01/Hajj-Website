package com.hajj.backend.dto;

import java.time.Instant;

/** Public list entry for a published article. */
public record PublicArticleSummary(
        Long id, String titleEn, String titleAr, String summaryEn, String summaryAr, Instant publishedAt
) {}

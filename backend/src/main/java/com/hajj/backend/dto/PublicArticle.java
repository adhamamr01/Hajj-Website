package com.hajj.backend.dto;

import java.time.Instant;

/** Public view of one published article. Deliberately has no status or link token. */
public record PublicArticle(
        Long id, String titleEn, String titleAr, String summaryEn, String summaryAr,
        String bodyEn, String bodyAr, Instant publishedAt
) {}

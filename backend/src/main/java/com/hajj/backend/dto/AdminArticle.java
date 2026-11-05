package com.hajj.backend.dto;

import java.time.Instant;

/** Full admin view of one article, including the active secret link token (if any). */
public record AdminArticle(
        Long id, String titleEn, String titleAr, String summaryEn, String summaryAr,
        String bodyEn, String bodyAr, String status,
        Instant createdAt, Instant updatedAt, Instant publishedAt, String linkToken
) {}

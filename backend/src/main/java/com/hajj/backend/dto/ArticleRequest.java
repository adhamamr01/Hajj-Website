package com.hajj.backend.dto;

import jakarta.validation.constraints.Size;

/**
 * Create/update body for an article. Null fields are ignored on update, so a
 * partial body only changes what it names. All fields are optional (drafts can be partial).
 */
public record ArticleRequest(
        @Size(max = 200) String titleEn,
        @Size(max = 200) String titleAr,
        @Size(max = 500) String summaryEn,
        @Size(max = 500) String summaryAr,
        @Size(max = 100_000) String bodyEn,
        @Size(max = 100_000) String bodyAr
) {}

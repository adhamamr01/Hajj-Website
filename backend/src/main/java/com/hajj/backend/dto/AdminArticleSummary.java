package com.hajj.backend.dto;

import java.time.Instant;

/** Admin list row: no bodies. linkToken is the active secret link, or null (e.g. drafts). */
public record AdminArticleSummary(
        Long id, String titleEn, String titleAr, String status,
        Instant createdAt, Instant updatedAt, Instant publishedAt, String linkToken
) {}

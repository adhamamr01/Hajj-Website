package com.hajj.backend.dto;

import jakarta.validation.constraints.Size;

/**
 * Fields that an admin can update on a journey step.
 * Null fields are ignored — only non-null values are applied.
 * stepNumber and id are intentionally excluded (structural, not editorial).
 */
public record UpdateJourneyStepRequest(
        @Size(max = 255) String title,
        @Size(max = 10000) String description,
        @Size(max = 50)  String borderColor,
        @Size(max = 50)  String titleColor
) {}

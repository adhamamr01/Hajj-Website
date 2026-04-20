package com.hajj.backend.dto;

/**
 * Fields that an admin can update on a journey step.
 * Null fields are ignored — only non-null values are applied.
 * stepNumber and id are intentionally excluded (structural, not editorial).
 */
public record UpdateJourneyStepRequest(
        String title,
        String description,
        String borderColor,
        String titleColor
) {}

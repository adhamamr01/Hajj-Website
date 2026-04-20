package com.hajj.backend.dto;

/**
 * Fields that an admin can update on a Meeqat point.
 * Null fields are ignored — only non-null values are applied.
 * lat, lng, and id are intentionally excluded (geographic, not editorial).
 */
public record UpdateMeeqatPointRequest(
        String name,
        String direction,
        String forPilgrims,
        String distance,
        String description,
        String color
) {}

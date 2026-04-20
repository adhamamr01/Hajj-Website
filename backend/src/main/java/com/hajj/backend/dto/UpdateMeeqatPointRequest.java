package com.hajj.backend.dto;

import jakarta.validation.constraints.Size;

/**
 * Fields that an admin can update on a Meeqat point.
 * Null fields are ignored — only non-null values are applied.
 * lat, lng, and id are intentionally excluded (geographic, not editorial).
 */
public record UpdateMeeqatPointRequest(
        @Size(max = 255)   String name,
        @Size(max = 50)    String direction,
        @Size(max = 255)   String forPilgrims,
        @Size(max = 20)    String distance,
        @Size(max = 10000) String description,
        @Size(max = 10)    String color
) {}

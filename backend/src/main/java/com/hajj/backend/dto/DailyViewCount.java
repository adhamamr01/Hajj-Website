package com.hajj.backend.dto;

/**
 * Spring Data projection for the daily trend native query.
 * Getter names must match the column aliases in the SQL exactly.
 */
public interface DailyViewCount {
    String getDate();
    Long   getViews();
}

package com.hajj.backend.dto;

/** Aggregated view counts for a single page path. */
public record PageStats(String page, long totalViews, long uniqueSessions) {}

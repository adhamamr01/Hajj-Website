package com.hajj.backend.service;

import com.hajj.backend.dto.DailyViewCount;
import com.hajj.backend.dto.PageStats;
import com.hajj.backend.model.PageView;
import com.hajj.backend.repository.PageViewRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Records and queries page view analytics.
 *
 * Analytics writes are intentionally not cached — every page view must be
 * persisted. Reads (summary, trend) query the DB directly; add caching here
 * if query latency becomes a concern as the table grows.
 */
@Service
public class AnalyticsService {

    private final PageViewRepository repo;

    public AnalyticsService(PageViewRepository repo) {
        this.repo = repo;
    }

    /** Persists a single page view event. */
    public void record(String page, String sessionId) {
        repo.save(new PageView(page, sessionId));
    }

    /**
     * Returns total views and unique sessions per page for the last {@code days} days.
     * Pass 0 to get all-time stats (since epoch).
     */
    public List<PageStats> summary(int days) {
        Instant since = days > 0
                ? Instant.now().minus(days, ChronoUnit.DAYS)
                : Instant.EPOCH;
        return repo.summarySince(since);
    }

    /** Returns daily view counts for the last {@code days} days. */
    public List<DailyViewCount> dailyTrend(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return repo.dailyTrend(since);
    }
}

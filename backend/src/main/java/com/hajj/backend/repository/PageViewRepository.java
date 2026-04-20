package com.hajj.backend.repository;

import com.hajj.backend.dto.DailyViewCount;
import com.hajj.backend.dto.PageStats;
import com.hajj.backend.model.PageView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PageViewRepository extends JpaRepository<PageView, Long> {

    /** Total views and unique sessions per page since a given timestamp. */
    @Query("""
            SELECT new com.hajj.backend.dto.PageStats(
                p.page,
                COUNT(p),
                COUNT(DISTINCT p.sessionId))
            FROM PageView p
            WHERE p.viewedAt >= :since
            GROUP BY p.page
            ORDER BY COUNT(p) DESC
            """)
    List<PageStats> summarySince(@Param("since") Instant since);

    /**
     * Daily view counts for a date range.
     * Uses a native query because JPQL has no DATE() truncation function.
     * Column aliases (date, views) must match the DailyViewCount projection getters.
     */
    @Query(value = """
            SELECT DATE(viewed_at)::text AS date, COUNT(*) AS views
            FROM page_view
            WHERE viewed_at >= :since
            GROUP BY DATE(viewed_at)
            ORDER BY date
            """, nativeQuery = true)
    List<DailyViewCount> dailyTrend(@Param("since") Instant since);
}

package com.hajj.backend.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Sliding-window IP rate limiter.
 *
 * Behaviour per request:
 *   - Non-/api/* paths → pass through, no check.
 *   - /api/* matching a known prefix → apply its per-minute limit.
 *   - /api/* with no matching prefix → reject 404.
 *
 * The sliding window is tracked per "ip:configPath" so each endpoint has an
 * independent window per IP — bursting on /api/analytics does not consume
 * the client's /api/admin budget.
 *
 * To add a new endpoint, add its prefix and limit to RATE_LIMITS below.
 */
@Component
@Order(2)   // runs after RequestLoggingFilter (Order 1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** Rolling window size in milliseconds (1 minute). */
    private static final long WINDOW_MS = 60_000;

    /**
     * Allowed path prefixes and their per-IP-per-minute request limits.
     * Longest-prefix matching is used, so /api/meeqat covers /api/meeqat/{id}.
     */
    private static final Map<String, Integer> RATE_LIMITS = Map.of(
        "/api/meeqat",    20,
        "/api/journey",   20,
        "/api/boundary",  20,
        "/api/analytics", 60,
        "/api/admin",     10
    );

    /**
     * Key: "ip:configPath" — e.g. "1.2.3.4:/api/meeqat"
     * Tracking per IP per path prefix gives each endpoint an independent window.
     */
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestLog =
            new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req = (HttpServletRequest)  request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        String ip   = resolveClientIp(req);
        long   now  = System.currentTimeMillis();

        // Only apply to /api/* paths; everything else passes through freely.
        if (!path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        var limitEntry = findMatchingLimit(path);

        if (limitEntry.isEmpty()) {
            log.warn("Rejected unregistered path '{}' from IP {}", path, ip);
            res.setStatus(404);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Not found\"}");
            return;
        }

        int    maxRequests = limitEntry.get().getValue();
        String windowKey   = ip + ":" + limitEntry.get().getKey();

        ConcurrentLinkedDeque<Long> timestamps =
                requestLog.computeIfAbsent(windowKey, k -> new ConcurrentLinkedDeque<>());

        // Drop timestamps outside the rolling window
        long windowStart = now - WINDOW_MS;
        timestamps.removeIf(t -> t < windowStart);

        // Remove stale map entry so inactive IPs don't accumulate in memory,
        // then recreate it for the current request.
        if (timestamps.isEmpty()) {
            requestLog.remove(windowKey, timestamps);
            timestamps = requestLog.computeIfAbsent(windowKey, k -> new ConcurrentLinkedDeque<>());
        }

        timestamps.addLast(now);

        if (timestamps.size() > maxRequests) {
            log.warn("Rate limit exceeded — IP: {}, path: {}, count: {}/{} in last {}s",
                    ip, path, timestamps.size(), maxRequests, WINDOW_MS / 1000);
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write(
                    "{\"error\":\"Too many requests. Please wait before retrying.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    /**
     * Finds the most specific (longest) path prefix that matches the given
     * request path.
     */
    private Optional<Map.Entry<String, Integer>> findMatchingLimit(String path) {
        return RATE_LIMITS.entrySet().stream()
                .filter(e -> path.startsWith(e.getKey()))
                .max(Comparator.comparingInt(e -> e.getKey().length()));
    }

    /**
     * Returns the originating client IP.
     *
     * Render's load balancer appends the real client IP as the LAST entry in
     * X-Forwarded-For. Taking the first entry is spoofable; taking the last
     * uses the IP that Render's infrastructure observed directly.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}

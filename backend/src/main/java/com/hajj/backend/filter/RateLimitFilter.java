package com.hajj.backend.filter;

import com.hajj.backend.service.ApiConfigService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Sliding-window IP rate limiter driven by the api_config table.
 *
 * Each API path prefix has its own limit (e.g. /api/analytics allows 60/min,
 * /api/admin allows 10/min). Limits are read from the database via
 * ApiConfigService, which caches them in Caffeine so the DB is not hit on
 * every request.
 *
 * The sliding window is tracked per IP per path-prefix so each endpoint
 * has an independent window — bursting on /api/meeqat does not consume
 * the client's /api/admin budget.
 *
 * If a request path has no matching api_config row, a default limit of
 * DEFAULT_MAX_REQUESTS is applied and a warning is logged. This prevents
 * new endpoints from being silently unprotected — add a row to api_config
 * (via a Flyway migration) to give a new endpoint an explicit limit.
 *
 * @Lazy on the ApiConfigService injection defers its creation until the
 * first request arrives, by which point the full Spring context (JPA,
 * Caffeine) is ready. Without @Lazy the filter would try to inject the
 * service before the JPA infrastructure has started.
 */
@Component
@Order(2)   // runs after RequestLoggingFilter (Order 1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** Fallback limit applied when a path has no api_config row. */
    private static final int  DEFAULT_MAX_REQUESTS = 20;

    /** Rolling window size in milliseconds (1 minute). */
    private static final long WINDOW_MS = 60_000;

    private final ApiConfigService apiConfigService;

    /**
     * Key: "ip:configPath" — e.g. "1.2.3.4:/api/meeqat"
     * Tracking per IP per path prefix gives each endpoint an independent window.
     */
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestLog =
            new ConcurrentHashMap<>();

    public RateLimitFilter(@Lazy ApiConfigService apiConfigService) {
        this.apiConfigService = apiConfigService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req = (HttpServletRequest)  request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        String ip   = resolveClientIp(req);
        long   now  = System.currentTimeMillis();

        // Look up the limit for this path from the DB-backed config
        var config = apiConfigService.findMatchingConfig(path);
        int    maxRequests;
        String windowKey;

        if (config.isPresent()) {
            maxRequests = config.get().getMaxRequestsPerMinute();
            windowKey   = ip + ":" + config.get().getPath();
        } else {
            log.warn("No api_config entry for path '{}' — applying default limit of {}/min", path, DEFAULT_MAX_REQUESTS);
            maxRequests = DEFAULT_MAX_REQUESTS;
            windowKey   = ip + ":default";
        }

        ConcurrentLinkedDeque<Long> timestamps =
                requestLog.computeIfAbsent(windowKey, k -> new ConcurrentLinkedDeque<>());

        // Drop timestamps outside the rolling window
        long windowStart = now - WINDOW_MS;
        timestamps.removeIf(t -> t < windowStart);
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
     * Returns the originating client IP.
     * Checks X-Forwarded-For first so proxy/CDN setups report the real IP.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

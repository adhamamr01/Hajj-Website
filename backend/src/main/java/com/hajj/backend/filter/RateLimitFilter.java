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
 * Behaviour per request:
 *   - Non-/api/* paths (health checks etc.) → pass through, no check.
 *   - /api/* with a matching enabled api_config row → apply its per-minute limit.
 *   - /api/* with NO matching row → reject 404. This acts as an allowlist:
 *     adding a new endpoint requires a Flyway migration to register it first.
 *
 * The sliding window is tracked per "ip:configPath" so each endpoint has an
 * independent window per IP — bursting on /api/analytics does not consume
 * the client's /api/admin budget.
 *
 * Limits are read via ApiConfigService which caches them in Caffeine (warmed
 * on startup) so no DB hit occurs per request.
 *
 * @Lazy on the ApiConfigService injection defers its creation until the first
 * request arrives, after the full Spring context (JPA, Caffeine) is ready.
 */
@Component
@Order(2)   // runs after RequestLoggingFilter (Order 1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

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

        // Only apply the allowlist check to /api/* paths.
        // Other paths (actuator, static files, etc.) pass through freely.
        if (!path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        // Look up the limit for this path from the Caffeine-cached config
        var config = apiConfigService.findMatchingConfig(path);

        if (config.isEmpty()) {
            // Path is not registered in api_config — reject before it reaches any controller.
            // To expose a new endpoint, add a row to api_config via a Flyway migration.
            log.warn("Rejected unregistered path '{}' from IP {}", path, ip);
            res.setStatus(404);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Not found\"}");
            return;
        }

        int    maxRequests = config.get().getMaxRequestsPerMinute();
        String windowKey   = ip + ":" + config.get().getPath();

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

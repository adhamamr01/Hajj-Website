package com.hajj.backend.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Sliding-window IP rate limiter — no external libraries required.
 *
 * Each IP address is allowed MAX_REQUESTS within a rolling WINDOW_MS
 * millisecond window.  Requests that exceed the limit receive a 429
 * response with a JSON error body.
 *
 * Implementation notes:
 *  - ConcurrentHashMap + ConcurrentLinkedDeque give thread-safe per-IP
 *    tracking without explicit locking.
 *  - Old timestamps are pruned on every request for that IP, so memory
 *    usage stays proportional to active clients × window size.
 *  - X-Forwarded-For is read first so the real client IP is used when
 *    the app sits behind a reverse proxy (Render's load balancer).
 */
@Component
@Order(2)   // runs after RequestLoggingFilter (Order 1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** Maximum requests allowed per IP within the window. */
    private static final int  MAX_REQUESTS = 100;

    /** Rolling window size in milliseconds (1 minute). */
    private static final long WINDOW_MS    = 60_000;

    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestLog =
            new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req = (HttpServletRequest)  request;
        HttpServletResponse res = (HttpServletResponse) response;

        String ip  = resolveClientIp(req);
        long   now = System.currentTimeMillis();

        ConcurrentLinkedDeque<Long> timestamps =
                requestLog.computeIfAbsent(ip, k -> new ConcurrentLinkedDeque<>());

        // Drop timestamps that have fallen outside the window
        long windowStart = now - WINDOW_MS;
        timestamps.removeIf(t -> t < windowStart);

        // Record this request
        timestamps.addLast(now);

        if (timestamps.size() > MAX_REQUESTS) {
            log.warn("Rate limit exceeded for IP {}: {} requests in last {}s",
                    ip, timestamps.size(), WINDOW_MS / 1000);
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
            // Header may contain a comma-separated chain; first entry is the client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

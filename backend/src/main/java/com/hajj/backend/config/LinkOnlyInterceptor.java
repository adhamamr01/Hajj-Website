package com.hajj.backend.config;

import com.hajj.backend.model.PageLink;
import com.hajj.backend.service.PageLinkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Server-side enforcement of "link-only" mode (site.link-only=true).
 *
 * In link-only mode, content data is served only to a caller that presents an
 * X-Page-Token whose active link opens a page that uses that data. Anything
 * else gets the same 404 as an unknown path, so nothing is revealed.
 * Default-deny: any /api/** path that is neither exempt nor listed below is
 * treated as gated (and no page grants it).
 *
 * When link-only is off this does nothing at all.
 *
 * It is a HandlerInterceptor (not a servlet filter) so the 404 still carries
 * CORS headers and the browser can read the status.
 */
@Component
public class LinkOnlyInterceptor implements HandlerInterceptor {

    /** Gated data prefix → page keys whose link grants access to it. */
    private static final Map<String, Set<String>> GATED = Map.of(
        "/api/journey",  Set.of("journey"),
        "/api/meeqat",   Set.of("meeqat"),
        "/api/boundary", Set.of("boundaries")
    );

    /** Never gated: link resolution, write-only analytics, and admin (own key check). */
    private static final List<String> EXEMPT = List.of("/api/links", "/api/analytics", "/api/admin");

    static final String TOKEN_HEADER = "X-Page-Token";

    private final PageLinkService pageLinkService;
    private final boolean linkOnly;

    public LinkOnlyInterceptor(PageLinkService pageLinkService,
                               @Value("${site.link-only:false}") boolean linkOnly) {
        this.pageLinkService = pageLinkService;
        this.linkOnly = linkOnly;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
        if (!linkOnly) return true;

        res.setHeader("X-Robots-Tag", "noindex, nofollow");

        if (CorsUtils.isPreFlightRequest(req)) return true;

        String path = req.getRequestURI();
        if (EXEMPT.stream().anyMatch(p -> isUnder(path, p))) return true;

        Set<String> allowedPages = GATED.entrySet().stream()
                .filter(e -> isUnder(path, e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(Set.of());

        boolean allowed = pageLinkService.resolve(req.getHeader(TOKEN_HEADER))
                .filter(l -> l.getTargetType() == PageLink.TargetType.PAGE)
                .map(PageLink::getTargetKey)
                .filter(allowedPages::contains)
                .isPresent();
        if (allowed) return true;

        res.setStatus(404);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"Not found\"}");
        return false;
    }

    private static boolean isUnder(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/");
    }
}

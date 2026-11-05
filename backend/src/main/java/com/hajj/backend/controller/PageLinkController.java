package com.hajj.backend.controller;

import com.hajj.backend.dto.LinkTarget;
import com.hajj.backend.service.PageLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Public endpoint that tells the frontend what a secret link opens.
 * Unknown and revoked tokens get the same 404, so nothing is revealed.
 * Works whether or not link-only mode is on.
 */
@RestController
@RequestMapping("/api/links")
public class PageLinkController {

    private final PageLinkService pageLinkService;

    public PageLinkController(PageLinkService pageLinkService) {
        this.pageLinkService = pageLinkService;
    }

    @GetMapping("/{token}")
    public LinkTarget resolve(@PathVariable String token) {
        return pageLinkService.resolve(token)
                .map(l -> new LinkTarget(l.getTargetType().name(), l.getTargetKey()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }
}

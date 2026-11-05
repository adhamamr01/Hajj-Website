package com.hajj.backend.config;

import com.hajj.backend.service.PageLinkService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Generates any missing page links on startup, so tokens are created at
 * runtime and never appear in migrations or the repository.
 */
@Component
public class PageLinkInitializer implements ApplicationRunner {

    private final PageLinkService pageLinkService;

    public PageLinkInitializer(PageLinkService pageLinkService) {
        this.pageLinkService = pageLinkService;
    }

    @Override
    public void run(ApplicationArguments args) {
        pageLinkService.ensurePageLinks();
    }
}

package com.hajj.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Registers the link-only gate (a no-op unless site.link-only=true). */
@Configuration
public class LinkOnlyConfig implements WebMvcConfigurer {

    private final LinkOnlyInterceptor linkOnlyInterceptor;

    public LinkOnlyConfig(LinkOnlyInterceptor linkOnlyInterceptor) {
        this.linkOnlyInterceptor = linkOnlyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(linkOnlyInterceptor).addPathPatterns("/api/**");
    }
}

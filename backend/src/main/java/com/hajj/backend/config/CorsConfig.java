package com.hajj.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the frontend to call the backend API from:
 *   - localhost:5173 / :3000  — local Vite dev server
 *   - *.netlify.app           — Netlify production + deploy-preview URLs
 *                               (Netlify gives each PR a unique subdomain)
 *
 * In production, Netlify also proxies /api/* to this backend, so the
 * browser never makes a cross-origin call at all — CORS is only needed
 * during local development.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:5173", "http://localhost:3000", "https://*.netlify.app")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");
    }
}

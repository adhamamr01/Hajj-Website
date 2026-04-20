package com.hajj.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Locks down every path that is not under /api/*.
 *
 * /api/** is permitted here and then further gated by two layers:
 *   1. RateLimitFilter — rejects paths not registered in api_config (allowlist).
 *   2. AdminController — checks the X-Admin-Key header for /api/admin/** routes.
 *
 * Everything else (Actuator, static files, anything not /api/*) is denied.
 * This prevents /actuator/env and similar endpoints from being publicly accessible.
 *
 * CSRF is disabled because this is a stateless REST API — there are no
 * session cookies to protect against cross-site forgery.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**", "/actuator/health").permitAll()
                .anyRequest().denyAll()
            );
        return http.build();
    }
}

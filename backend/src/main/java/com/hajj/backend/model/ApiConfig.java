package com.hajj.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Rate-limit configuration for an API path prefix.
 *
 * The path field is a prefix: /api/meeqat covers both
 * GET /api/meeqat and GET /api/meeqat/{id}.
 *
 * Any /api/* request that does not match any enabled row
 * is rejected by RateLimitFilter with a 404 response.
 */
@Entity
@Table(name = "api_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Path prefix, e.g. /api/meeqat */
    @Column(nullable = false, unique = true)
    private String path;

    /** Maximum requests allowed per IP per minute for this prefix. */
    @Column(nullable = false)
    private int maxRequestsPerMinute;

    /** Set to false to block this path entirely without removing the row. */
    @Column(nullable = false)
    private boolean enabled = true;
}

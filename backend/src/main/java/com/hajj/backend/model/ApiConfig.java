package com.hajj.backend.model;

import jakarta.persistence.*;

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

    // JPA requires a no-arg constructor
    public ApiConfig() {}

    public ApiConfig(Long id, String path, int maxRequestsPerMinute, boolean enabled) {
        this.id = id;
        this.path = path;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.enabled = enabled;
    }

    public Long getId()                    { return id; }
    public String getPath()                { return path; }
    public int getMaxRequestsPerMinute()   { return maxRequestsPerMinute; }
    public boolean isEnabled()             { return enabled; }

    public void setId(Long id)                                   { this.id = id; }
    public void setPath(String path)                             { this.path = path; }
    public void setMaxRequestsPerMinute(int maxRequestsPerMinute){ this.maxRequestsPerMinute = maxRequestsPerMinute; }
    public void setEnabled(boolean enabled)                      { this.enabled = enabled; }
}

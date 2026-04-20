package com.hajj.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Records a single page view event.
 * Written on every frontend route change; never updated or deleted.
 *
 * NOTE: Do NOT add Lombok @Data / @NoArgsConstructor / @AllArgsConstructor.
 * Lombok's annotation processor fails silently on Java 25 — keep explicit
 * no-arg constructor and getters/setters.
 */
@Entity
@Table(name = "page_view")
public class PageView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String page;

    /** UUID from the browser's sessionStorage — resets on tab close. */
    private String sessionId;

    @Column(nullable = false)
    private Instant viewedAt = Instant.now();

    public PageView() {}

    public PageView(String page, String sessionId) {
        this.page      = page;
        this.sessionId = sessionId;
    }

    public Long    getId()        { return id; }
    public String  getPage()      { return page; }
    public String  getSessionId() { return sessionId; }
    public Instant getViewedAt()  { return viewedAt; }

    public void setId(Long id)               { this.id        = id; }
    public void setPage(String page)         { this.page      = page; }
    public void setSessionId(String sid)     { this.sessionId = sid; }
    public void setViewedAt(Instant viewedAt){ this.viewedAt   = viewedAt; }
}

package com.hajj.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A secret link token that opens one page (or, later, article) in link-only mode.
 * A link is active while revokedAt is null; at most one active link exists per target.
 *
 * NOTE: Do NOT add Lombok — see JourneyStep. Keep explicit constructors and getters/setters.
 */
@Entity
@Table(name = "page_link")
public class PageLink {

    public enum TargetType { PAGE, ARTICLE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TargetType targetType;

    @Column(nullable = false, length = 100)
    private String targetKey;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant revokedAt;

    public PageLink() {}

    public PageLink(String token, TargetType targetType, String targetKey) {
        this.token      = token;
        this.targetType = targetType;
        this.targetKey  = targetKey;
    }

    public Long       getId()         { return id; }
    public String     getToken()      { return token; }
    public TargetType getTargetType() { return targetType; }
    public String     getTargetKey()  { return targetKey; }
    public Instant    getCreatedAt()  { return createdAt; }
    public Instant    getRevokedAt()  { return revokedAt; }

    public void setId(Long id)                  { this.id         = id; }
    public void setToken(String token)          { this.token      = token; }
    public void setTargetType(TargetType type)  { this.targetType = type; }
    public void setTargetKey(String targetKey)  { this.targetKey  = targetKey; }
    public void setCreatedAt(Instant createdAt) { this.createdAt  = createdAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt  = revokedAt; }
}

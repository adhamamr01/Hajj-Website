package com.hajj.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A bilingual article written in the admin tool. Bodies are Markdown.
 * Text fields are nullable so drafts can be partial; publishing is validated in ArticleService.
 *
 * NOTE: Do NOT add Lombok — see JourneyStep. Keep explicit constructors and getters/setters.
 */
@Entity
public class Article {

    public enum Status { DRAFT, PUBLISHED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200)
    private String titleEn;

    @Column(length = 200)
    private String titleAr;

    @Column(length = 500)
    private String summaryEn;

    @Column(length = 500)
    private String summaryAr;

    @Column(columnDefinition = "TEXT")
    private String bodyEn;

    @Column(columnDefinition = "TEXT")
    private String bodyAr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    private Instant publishedAt;

    public Article() {}

    @PreUpdate
    void touch() { this.updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitleEn() { return titleEn; }
    public void setTitleEn(String titleEn) { this.titleEn = titleEn; }

    public String getTitleAr() { return titleAr; }
    public void setTitleAr(String titleAr) { this.titleAr = titleAr; }

    public String getSummaryEn() { return summaryEn; }
    public void setSummaryEn(String summaryEn) { this.summaryEn = summaryEn; }

    public String getSummaryAr() { return summaryAr; }
    public void setSummaryAr(String summaryAr) { this.summaryAr = summaryAr; }

    public String getBodyEn() { return bodyEn; }
    public void setBodyEn(String bodyEn) { this.bodyEn = bodyEn; }

    public String getBodyAr() { return bodyAr; }
    public void setBodyAr(String bodyAr) { this.bodyAr = bodyAr; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}

package com.hajj.backend.model;

import jakarta.persistence.*;

/**
 * JPA entity for a named Haram boundary zone (center point + radius).
 *
 * NOTE: Do NOT add Lombok @Data / @NoArgsConstructor / @AllArgsConstructor.
 * Lombok's annotation processor fails silently on Java 25, so Jackson cannot
 * find getters and omits all fields from JSON responses. Keep explicit
 * no-arg constructor and getters/setters.
 */
@Entity
public class HaramBoundary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false)
    private double centerLat;

    @Column(nullable = false)
    private double centerLng;

    @Column(nullable = false)
    private double radius;

    private String color = "";

    public HaramBoundary() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getCenterLat() { return centerLat; }
    public void setCenterLat(double centerLat) { this.centerLat = centerLat; }

    public double getCenterLng() { return centerLng; }
    public void setCenterLng(double centerLng) { this.centerLng = centerLng; }

    public double getRadius() { return radius; }
    public void setRadius(double radius) { this.radius = radius; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}

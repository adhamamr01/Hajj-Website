package com.hajj.backend.model;

import jakarta.persistence.*;

/**
 * JPA entity for a single lat/lng vertex of the Haram boundary polygon,
 * ordered by orderIndex to form a closed shape on the map.
 *
 * NOTE: Do NOT add Lombok @Data / @NoArgsConstructor / @AllArgsConstructor.
 * Lombok's annotation processor fails silently on Java 25, so Jackson cannot
 * find getters and omits all fields from JSON responses. Keep explicit
 * no-arg constructor and getters/setters.
 */
@Entity
public class BoundaryPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name = "";

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(nullable = false)
    private int orderIndex;

    public BoundaryPoint() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}

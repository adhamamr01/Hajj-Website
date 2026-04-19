package com.hajj.backend.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class MeeqatPoint {

    @Id
    @Column(nullable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    private String direction   = "";
    private String forPilgrims = "";
    private String distance    = "";
    private String color       = "";
    private String modern      = "";

    @Column(columnDefinition = "TEXT")
    private String description = "";

    private String videoUrl    = "";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "meeqat_images", joinColumns = @JoinColumn(name = "meeqat_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();

    public MeeqatPoint() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }

    public String getForPilgrims() { return forPilgrims; }
    public void setForPilgrims(String forPilgrims) { this.forPilgrims = forPilgrims; }

    public String getDistance() { return distance; }
    public void setDistance(String distance) { this.distance = distance; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getModern() { return modern; }
    public void setModern(String modern) { this.modern = modern; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
}

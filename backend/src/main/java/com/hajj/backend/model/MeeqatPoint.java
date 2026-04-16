package com.hajj.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeeqatPoint {

    @Id
    private String id;
    private String name;
    private double lat;
    private double lng;
    private String direction;
    private String forPilgrims;
    private String distance;
    private String color;
    private String modern;
    private String description;
    private String videoUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "meeqat_images", joinColumns = @JoinColumn(name = "meeqat_id"))
    @Column(name = "image_url")
    private List<String> images;
}

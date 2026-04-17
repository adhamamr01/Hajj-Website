package com.hajj.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    // Nullable in DB — default to empty string so JSON never gets null
    private String direction    = "";
    private String forPilgrims  = "";
    private String distance     = "";
    private String color        = "";
    private String modern       = "";

    @Column(columnDefinition = "TEXT")
    private String description  = "";

    private String videoUrl     = "";

    // @ElementCollection — initialised here so Jackson always serialises [] not null
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "meeqat_images", joinColumns = @JoinColumn(name = "meeqat_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();
}

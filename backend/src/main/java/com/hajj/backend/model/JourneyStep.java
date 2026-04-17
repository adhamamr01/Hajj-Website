package com.hajj.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JourneyStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int stepNumber;

    @Column(nullable = false)
    private String title;

    // Nullable in DB — default to empty string so JSON never gets null
    @Column(columnDefinition = "TEXT")
    private String description  = "";

    private String borderColor  = "";
    private String titleColor   = "";
}

package com.hajj.backend.model;

import jakarta.persistence.*;

@Entity
public class JourneyStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int stepNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    private String borderColor = "";
    private String titleColor  = "";

    public JourneyStep() {}

    public JourneyStep(Long id, int stepNumber, String title,
                       String description, String borderColor, String titleColor) {
        this.id = id;
        this.stepNumber = stepNumber;
        this.title = title;
        this.description = description;
        this.borderColor = borderColor;
        this.titleColor = titleColor;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBorderColor() { return borderColor; }
    public void setBorderColor(String borderColor) { this.borderColor = borderColor; }

    public String getTitleColor() { return titleColor; }
    public void setTitleColor(String titleColor) { this.titleColor = titleColor; }
}

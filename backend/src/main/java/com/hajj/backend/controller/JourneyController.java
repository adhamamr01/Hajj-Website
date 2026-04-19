package com.hajj.backend.controller;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.service.JourneyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journey")
public class JourneyController {

    private final JourneyService journeyService;

    public JourneyController(JourneyService journeyService) {
        this.journeyService = journeyService;
    }

    @GetMapping
    public List<JourneyStep> getAll() {
        return journeyService.findAllOrdered();
    }
}

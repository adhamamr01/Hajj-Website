package com.hajj.backend.controller;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.service.JourneyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journey")
@RequiredArgsConstructor
public class JourneyController {

    private final JourneyService journeyService;

    @GetMapping
    public List<JourneyStep> getAll() {
        return journeyService.findAllOrdered();
    }
}

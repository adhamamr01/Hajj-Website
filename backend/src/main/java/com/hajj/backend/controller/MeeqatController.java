package com.hajj.backend.controller;

import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.service.MeeqatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meeqat")
@RequiredArgsConstructor
public class MeeqatController {

    private final MeeqatService meeqatService;

    @GetMapping
    public List<MeeqatPoint> getAll() {
        return meeqatService.findAll();
    }

    @GetMapping("/{id}")
    public MeeqatPoint getById(@PathVariable String id) {
        return meeqatService.findById(id);
    }
}

package com.hajj.backend.service;

import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.repository.MeeqatRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MeeqatService {

    private final MeeqatRepository meeqatRepository;

    public MeeqatService(MeeqatRepository meeqatRepository) {
        this.meeqatRepository = meeqatRepository;
    }

    @Cacheable("meeqat")
    public List<MeeqatPoint> findAll() {
        return meeqatRepository.findAll();
    }

    @Cacheable(value = "meeqat", key = "#id")
    public MeeqatPoint findById(String id) {
        return meeqatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeqat point not found: " + id));
    }
}

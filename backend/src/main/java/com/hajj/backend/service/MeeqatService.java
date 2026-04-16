package com.hajj.backend.service;

import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.repository.MeeqatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeeqatService {

    private final MeeqatRepository meeqatRepository;

    public List<MeeqatPoint> findAll() {
        return meeqatRepository.findAll();
    }

    public MeeqatPoint findById(String id) {
        return meeqatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeqat point not found: " + id));
    }
}

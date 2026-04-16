package com.hajj.backend.repository;

import com.hajj.backend.model.MeeqatPoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeeqatRepository extends JpaRepository<MeeqatPoint, String> {
}

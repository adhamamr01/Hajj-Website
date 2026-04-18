package com.hajj.backend.repository;

import com.hajj.backend.model.ApiConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiConfigRepository extends JpaRepository<ApiConfig, Long> {

    /** Returns all rows where enabled = true. */
    List<ApiConfig> findByEnabledTrue();
}

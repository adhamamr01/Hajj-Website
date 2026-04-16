package com.hajj.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class HajjBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(HajjBackendApplication.class, args);
    }
}

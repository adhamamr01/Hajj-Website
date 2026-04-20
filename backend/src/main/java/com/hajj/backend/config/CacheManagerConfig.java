package com.hajj.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Defines all application caches in one place.
 *
 * Using SimpleCacheManager + individual CaffeineCache instances lets each
 * cache have its own size and TTL instead of sharing one global spec.
 * recordStats() is enabled on every cache so AdminController can expose
 * hit/miss rates without any extra library.
 *
 * To add a new cache:
 *   1. Add a build(...) entry below.
 *   2. Add the name to the @Cacheable annotation on the service method.
 *   No application.properties change needed.
 */
@Configuration
@EnableCaching
public class CacheManagerConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
            //            name               maxEntries  ttlMinutes
            build("meeqat",                  100,        60),
            build("journey",                   50,        60),
            build("boundaries",                50,        60),
            build("boundaryPoints",            50,        60)
        ));
        return manager;
    }

    /**
     * Builds a named Caffeine cache.
     * @param ttlMinutes pass -1 for no expiry (entries live until evicted by size).
     */
    private CaffeineCache build(String name, int maxSize, int ttlMinutes) {
        var builder = Caffeine.newBuilder()
                .maximumSize(maxSize)
                .recordStats();
        if (ttlMinutes > 0) {
            builder.expireAfterWrite(ttlMinutes, TimeUnit.MINUTES);
        }
        return new CaffeineCache(name, builder.build());
    }
}

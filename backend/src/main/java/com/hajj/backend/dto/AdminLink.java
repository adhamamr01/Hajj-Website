package com.hajj.backend.dto;

import java.time.Instant;

/** Admin view of an active link, including the secret token. */
public record AdminLink(String type, String key, String token, Instant createdAt) {}

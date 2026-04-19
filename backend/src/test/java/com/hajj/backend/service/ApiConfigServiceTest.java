package com.hajj.backend.service;

import com.hajj.backend.model.ApiConfig;
import com.hajj.backend.repository.ApiConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApiConfigServiceTest {

    @Mock  ApiConfigRepository repository;
    @InjectMocks ApiConfigService service;

    @Test
    void findMatchingConfig_returnsLongestPrefixMatch() {
        ApiConfig meeqat   = configWith("/api/meeqat", 20);
        ApiConfig meeqatId = configWith("/api/meeqat/dhul-hulayfah", 5);
        when(repository.findByEnabledTrue()).thenReturn(List.of(meeqat, meeqatId));

        Optional<ApiConfig> result = service.findMatchingConfig("/api/meeqat/dhul-hulayfah");

        // Should match the more specific path, not the shorter prefix
        assertThat(result).isPresent();
        assertThat(result.get().getPath()).isEqualTo("/api/meeqat/dhul-hulayfah");
    }

    @Test
    void findMatchingConfig_fallsBackToShortPrefix() {
        ApiConfig meeqat = configWith("/api/meeqat", 20);
        when(repository.findByEnabledTrue()).thenReturn(List.of(meeqat));

        Optional<ApiConfig> result = service.findMatchingConfig("/api/meeqat/al-juhfah");

        assertThat(result).isPresent();
        assertThat(result.get().getPath()).isEqualTo("/api/meeqat");
    }

    @Test
    void findMatchingConfig_returnsEmptyWhenNoMatch() {
        when(repository.findByEnabledTrue()).thenReturn(List.of(configWith("/api/meeqat", 20)));

        assertThat(service.findMatchingConfig("/api/unknown")).isEmpty();
    }

    @Test
    void findMatchingConfig_returnsEmptyWhenNoConfigsExist() {
        when(repository.findByEnabledTrue()).thenReturn(List.of());

        assertThat(service.findMatchingConfig("/api/meeqat")).isEmpty();
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static ApiConfig configWith(String path, int maxRequests) {
        ApiConfig c = new ApiConfig();
        c.setPath(path);
        c.setMaxRequestsPerMinute(maxRequests);
        c.setEnabled(true);
        return c;
    }
}

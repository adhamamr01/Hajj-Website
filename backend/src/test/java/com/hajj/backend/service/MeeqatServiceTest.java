package com.hajj.backend.service;

import com.hajj.backend.model.MeeqatPoint;
import com.hajj.backend.repository.MeeqatRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeeqatServiceTest {

    @Mock  MeeqatRepository repository;
    @InjectMocks MeeqatService service;

    @Test
    void findAll_returnsAllPoints() {
        MeeqatPoint p = pointWith("dhul-hulayfah", "Dhul-Hulayfah");
        when(repository.findAll()).thenReturn(List.of(p));

        assertThat(service.findAll()).containsExactly(p);
    }

    @Test
    void findById_returnsPointWhenFound() {
        MeeqatPoint p = pointWith("al-juhfah", "Al-Juhfah");
        when(repository.findById("al-juhfah")).thenReturn(Optional.of(p));

        assertThat(service.findById("al-juhfah")).isEqualTo(p);
    }

    @Test
    void findById_throwsWhenNotFound() {
        when(repository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById("unknown"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("unknown");
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static MeeqatPoint pointWith(String id, String name) {
        MeeqatPoint p = new MeeqatPoint();
        p.setId(id);
        p.setName(name);
        p.setLat(21.0);
        p.setLng(39.0);
        return p;
    }
}

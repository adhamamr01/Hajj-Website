package com.hajj.backend.service;

import com.hajj.backend.model.JourneyStep;
import com.hajj.backend.repository.JourneyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JourneyServiceTest {

    @Mock  JourneyRepository repository;
    @InjectMocks JourneyService service;

    @Test
    void findAllOrdered_delegatesToRepository() {
        JourneyStep s1 = stepWith(1L, 1, "Intention & Preparation");
        JourneyStep s2 = stepWith(2L, 2, "Entering Ihram");
        when(repository.findAllByOrderByStepNumberAsc()).thenReturn(List.of(s1, s2));

        List<JourneyStep> result = service.findAllOrdered();

        assertThat(result).containsExactly(s1, s2);
        verify(repository).findAllByOrderByStepNumberAsc();
    }

    @Test
    void findAllOrdered_returnsEmptyListWhenNoSteps() {
        when(repository.findAllByOrderByStepNumberAsc()).thenReturn(List.of());

        assertThat(service.findAllOrdered()).isEmpty();
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static JourneyStep stepWith(Long id, int stepNumber, String title) {
        JourneyStep s = new JourneyStep();
        s.setId(id);
        s.setStepNumber(stepNumber);
        s.setTitle(title);
        return s;
    }
}

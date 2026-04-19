package com.hajj.backend.service;

import com.hajj.backend.model.BoundaryPoint;
import com.hajj.backend.model.HaramBoundary;
import com.hajj.backend.repository.BoundaryPointRepository;
import com.hajj.backend.repository.HaramBoundaryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoundaryServiceTest {

    @Mock  HaramBoundaryRepository haramBoundaryRepository;
    @Mock  BoundaryPointRepository boundaryPointRepository;
    @InjectMocks BoundaryService service;

    @Test
    void findAllBoundaries_delegatesToRepository() {
        HaramBoundary b = boundaryWith(1L, "Masjid al-Haram");
        when(haramBoundaryRepository.findAll()).thenReturn(List.of(b));

        assertThat(service.findAllBoundaries()).containsExactly(b);
        verify(haramBoundaryRepository).findAll();
    }

    @Test
    void findAllBoundaryPoints_returnsPointsOrderedByIndex() {
        BoundaryPoint p0 = pointWith(1L, 0);
        BoundaryPoint p1 = pointWith(2L, 1);
        when(boundaryPointRepository.findAllByOrderByOrderIndexAsc()).thenReturn(List.of(p0, p1));

        List<BoundaryPoint> result = service.findAllBoundaryPoints();

        assertThat(result).containsExactly(p0, p1);
        verify(boundaryPointRepository).findAllByOrderByOrderIndexAsc();
    }

    @Test
    void findAllBoundaries_returnsEmptyListWhenNoBoundaries() {
        when(haramBoundaryRepository.findAll()).thenReturn(List.of());

        assertThat(service.findAllBoundaries()).isEmpty();
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static HaramBoundary boundaryWith(Long id, String name) {
        HaramBoundary b = new HaramBoundary();
        b.setId(id);
        b.setName(name);
        b.setCenterLat(21.4225);
        b.setCenterLng(39.8262);
        b.setRadius(3.0);
        return b;
    }

    private static BoundaryPoint pointWith(Long id, int orderIndex) {
        BoundaryPoint p = new BoundaryPoint();
        p.setId(id);
        p.setLat(21.3 + orderIndex * 0.1);
        p.setLng(39.8);
        p.setOrderIndex(orderIndex);
        return p;
    }
}

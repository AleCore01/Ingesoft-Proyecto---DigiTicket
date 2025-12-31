package com.digiticket.service.impl.dashboard;

import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.repository.dashboard.EventMetricsRepository;
import com.digiticket.service.dashboard.EventMetricsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventMetricsServiceImpl implements EventMetricsService {

    private final EventMetricsRepository repository;

    public EventMetricsServiceImpl(EventMetricsRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<TopEventDTO> getTopEvents(int top) {

        // Primer día del mes a las 00:00:00
        LocalDateTime start = LocalDate.now()
                .withDayOfMonth(1)
                .atStartOfDay();

        // Día actual a las 23:59:59
        LocalDateTime end = LocalDate.now()
                .atTime(23, 59, 59);

        return repository.findTopEventsBetween(start, end, PageRequest.of(0, top));
    }
}

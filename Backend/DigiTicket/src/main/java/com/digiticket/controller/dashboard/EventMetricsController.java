package com.digiticket.controller.dashboard;

import com.digiticket.dto.dashboard.TopEventDTO;
import com.digiticket.service.dashboard.EventMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/eventsMetrics")
public class EventMetricsController {
    private final EventMetricsService service;

    public EventMetricsController(EventMetricsService service) {
        this.service = service;
    }

    @GetMapping("/top-events")
    public List<TopEventDTO> getTopEvents(@RequestParam(defaultValue = "5") int top) {
        return service.getTopEvents(top);
    }
}

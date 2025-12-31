package com.digiticket.service.dashboard;

import com.digiticket.dto.dashboard.TopEventDTO;

import java.util.List;

public interface EventMetricsService {
    List<TopEventDTO> getTopEvents(int top);
}

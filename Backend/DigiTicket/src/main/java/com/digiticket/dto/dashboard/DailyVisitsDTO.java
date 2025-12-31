package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyVisitsDTO {
    private Integer visitsToday;
    private Double variationVsYesterday; // %
}

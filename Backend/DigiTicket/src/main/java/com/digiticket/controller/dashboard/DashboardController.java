package com.digiticket.controller.dashboard;

import com.digiticket.dto.dashboard.DailySalesDTO;
import com.digiticket.dto.dashboard.DailyTicketsDTO;
import com.digiticket.dto.dashboard.DailyVisitsDTO;
import com.digiticket.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/sales/today")
    public ResponseEntity<DailySalesDTO> getTodaySales() {
        return ResponseEntity.ok(dashboardService.getTodaySales());
    }

    @GetMapping("/tickets/today")
    public ResponseEntity<DailyTicketsDTO> getTodayTickets() {
        return ResponseEntity.ok(dashboardService.getTodayTickets());
    }

    @GetMapping("/visits/today")
    public ResponseEntity<DailyVisitsDTO> getTodayVisits() {
        return ResponseEntity.ok(dashboardService.getTodayVisits());
    }
}

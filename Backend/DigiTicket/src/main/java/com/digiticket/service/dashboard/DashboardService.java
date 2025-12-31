package com.digiticket.service.dashboard;

import com.digiticket.dto.dashboard.DailySalesDTO;
import com.digiticket.dto.dashboard.DailyTicketsDTO;
import com.digiticket.dto.dashboard.DailyVisitsDTO;

public interface DashboardService {
    DailySalesDTO getTodaySales();
    DailyTicketsDTO getTodayTickets();
    DailyVisitsDTO getTodayVisits();

}

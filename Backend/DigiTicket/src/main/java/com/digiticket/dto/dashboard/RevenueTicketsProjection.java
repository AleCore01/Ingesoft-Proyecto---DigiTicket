package com.digiticket.dto.dashboard;

public interface RevenueTicketsProjection {
    String getLabel();
    Long getTicketsSold();
    Double getRevenue();
}

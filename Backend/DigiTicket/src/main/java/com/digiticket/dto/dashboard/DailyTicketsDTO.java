package com.digiticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyTicketsDTO {
    private Integer ticketsToday;
    private Integer differenceVsYesterday; // incremento o decremento en unidades
}

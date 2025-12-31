package com.digiticket.dto.loyalty;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExpiringPointsDTO {

    private Integer points;
    private LocalDateTime expiresAt;
}

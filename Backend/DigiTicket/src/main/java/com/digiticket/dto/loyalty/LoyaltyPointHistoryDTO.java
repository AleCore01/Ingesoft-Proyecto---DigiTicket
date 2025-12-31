package com.digiticket.dto.loyalty;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LoyaltyPointHistoryDTO {

    private Integer id;
    private Integer clientId;
    private String status;          // ACTIVE, EXPIRED, USED
    private Integer points;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    
    // Campos adicionales para el frontend
    private String description;
    private String type;            // earned, redeemed, bonus
    private Integer balance;        // saldo acumulado hasta este punto
}

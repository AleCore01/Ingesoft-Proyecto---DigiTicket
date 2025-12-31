package com.digiticket.dto.loyalty;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EarnPointsRequestDTO {

    private Integer clientId;
    private BigDecimal totalAmount;
}

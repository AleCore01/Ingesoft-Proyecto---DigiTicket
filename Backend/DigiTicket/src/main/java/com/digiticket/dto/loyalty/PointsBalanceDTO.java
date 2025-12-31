package com.digiticket.dto.loyalty;

import lombok.Data;

import java.util.List;

@Data
public class PointsBalanceDTO {

    private Integer clientId;
    private Integer totalPoints;
    private Integer redeemablePoints;
    private List<ExpiringPointsDTO> expiringSoon;
}

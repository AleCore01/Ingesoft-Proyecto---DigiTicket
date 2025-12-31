package com.digiticket.service.loyalty;

import com.digiticket.dto.loyalty.LoyaltyPointHistoryDTO;
import com.digiticket.dto.loyalty.PointsBalanceDTO;

import java.math.BigDecimal;
import java.util.List;

public interface LoyaltyService {

    PointsBalanceDTO getBalance(Integer clientId);

    List<LoyaltyPointHistoryDTO> getHistory(Integer clientId);

    void addEarnedPoints(Integer clientId, BigDecimal totalAmount);

    void redeemPoints(Integer userId,Integer pointsToUse);
}

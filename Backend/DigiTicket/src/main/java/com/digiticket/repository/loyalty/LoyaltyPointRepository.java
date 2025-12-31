package com.digiticket.repository.loyalty;

import com.digiticket.domain.loyalty.LoyaltyPoint;
import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoyaltyPointRepository extends JpaRepository<LoyaltyPoint, Integer> {

    List<LoyaltyPoint> findByClientIdOrderByCreatedAtDesc(Integer clientId);

    @Query("SELECT DISTINCT lp.clientId FROM LoyaltyPoint lp WHERE lp.status = :status")
    List<Integer> findDistinctClientIdsByStatus(@Param("status") LoyaltyPointStatus status);

    List<LoyaltyPoint> findByStatusAndExpiresAtBetween(LoyaltyPointStatus loyaltyPointStatus, LocalDateTime from, LocalDateTime to);
}

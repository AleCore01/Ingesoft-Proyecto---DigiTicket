package com.digiticket.service.impl.loyalty;

import com.digiticket.domain.loyalty.LoyaltyPoint;
import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import com.digiticket.dto.loyalty.ExpiringPointsDTO;
import com.digiticket.dto.loyalty.LoyaltyPointHistoryDTO;
import com.digiticket.dto.loyalty.PointsBalanceDTO;
import com.digiticket.repository.loyalty.LoyaltyPointRepository;
import com.digiticket.service.loyalty.LoyaltyService;
import com.digiticket.service.settings.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoyaltyServiceImpl implements LoyaltyService {

    private final LoyaltyPointRepository loyaltyPointRepository;
    private final SettingsService settingsService;

    @Override
    @Transactional(readOnly = true)
    public PointsBalanceDTO getBalance(Integer clientId) {
        LocalDateTime now = LocalDateTime.now();
        List<LoyaltyPoint> pointsList = loyaltyPointRepository
                .findByClientIdOrderByCreatedAtDesc(clientId);

        // Puntos activos y no vencidos
        int activeNotExpired = pointsList.stream()
                .filter(p -> p.getStatus() == LoyaltyPointStatus.ACTIVE)
                .filter(p -> p.getExpiresAt() == null || !p.getExpiresAt().isBefore(now))
                .mapToInt(LoyaltyPoint::getPoints)
                .sum();

        // Puntos usados o expirados
        int usedOrExpired = pointsList.stream()
                .filter(p -> p.getStatus() == LoyaltyPointStatus.USED
                        || p.getStatus() == LoyaltyPointStatus.EXPIRED)
                .mapToInt(LoyaltyPoint::getPoints)
                .sum();

        int total = activeNotExpired - usedOrExpired;
        if (total < 0) total = 0;

        PointsBalanceDTO dto = new PointsBalanceDTO();
        dto.setClientId(clientId);
        dto.setTotalPoints(total);
        dto.setRedeemablePoints(total); // por ahora iguales

        LocalDateTime soonLimit = now.plusDays(30);
        List<ExpiringPointsDTO> expiringSoon = pointsList.stream()
                .filter(p -> p.getStatus() == LoyaltyPointStatus.ACTIVE)
                .filter(p -> p.getExpiresAt() != null)
                .filter(p -> p.getExpiresAt().isAfter(now)
                        && !p.getExpiresAt().isAfter(soonLimit))
                .map(p -> {
                    ExpiringPointsDTO e = new ExpiringPointsDTO();
                    e.setPoints(p.getPoints());
                    e.setExpiresAt(p.getExpiresAt());
                    return e;
                })
                .toList();

        dto.setExpiringSoon(expiringSoon);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoyaltyPointHistoryDTO> getHistory(Integer clientId) {
        List<LoyaltyPoint> points = loyaltyPointRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        
        // Calcular balance acumulado en orden cronológico (más antiguo primero)
        List<LoyaltyPoint> chronological = points.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .toList();
        
        int runningBalance = 0;
        java.util.Map<Integer, Integer> balanceMap = new java.util.HashMap<>();
        
        for (LoyaltyPoint p : chronological) {
            if (p.getStatus() == LoyaltyPointStatus.ACTIVE) {
                runningBalance += p.getPoints();
            } else if (p.getStatus() == LoyaltyPointStatus.USED) {
                // Los puntos usados se restan (nota: points ya puede ser negativo en el registro)
                runningBalance += p.getPoints(); // si points es negativo, resta
            }
            balanceMap.put(p.getId(), runningBalance);
        }
        
        // Retornar en orden descendente (más reciente primero) con balance calculado
        return points.stream()
                .map(p -> toHistoryDto(p, balanceMap.get(p.getId())))
                .toList();
    }

    @Override
    @Transactional
    public void addEarnedPoints(Integer clientId, BigDecimal totalAmount) {
        if (totalAmount == null) return;

        BigDecimal ratio = settingsService.getPointsToSolesRatio();
        if (ratio == null || ratio.compareTo(BigDecimal.ZERO) <= 0) {
            ratio = BigDecimal.ONE;
        }

        int points = totalAmount
            .multiply(ratio)
            .setScale(0, RoundingMode.FLOOR)
            .intValue();

        if (points <= 0) {
            return;
        }

        LoyaltyPoint lp = LoyaltyPoint.builder()
                .clientId(clientId)
                .points(points)
                .status(LoyaltyPointStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusDays(settingsService.getPointsExpirationDays()))
                .build();

        loyaltyPointRepository.save(lp);
    }

    //Para validar la cantidad de puntos ha consumir
    @Override
    @Transactional
    public void redeemPoints(Integer userId, Integer pointsToUse ) {
        if(pointsToUse <=0){
            throw new IllegalArgumentException("pointToUse debe ser mayor que cero");
        }
        //Obtener puntos activos y no vencidos, ordenados por fecha de expiración
        LocalDateTime now = LocalDateTime.now();
        List<LoyaltyPoint> activePoints=loyaltyPointRepository
                .findByClientIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(p->p.getStatus()==LoyaltyPointStatus.ACTIVE)
                .filter(p->p.getExpiresAt()==null||p.getExpiresAt().isAfter(now))
                .sorted((a,b)->a.getExpiresAt().compareTo(b.getExpiresAt()))
                .toList();

        // Calcular saldo disponible
        int totalAvailable = activePoints.stream()
                .mapToInt(LoyaltyPoint::getPoints)
                .sum();

        if(totalAvailable < pointsToUse){
            throw new IllegalStateException("No tienes suficientes puntos para este canje.");
        }
        //Consumir puntos FIFO
        int remainingPoints = pointsToUse;
        for(LoyaltyPoint lp:activePoints){
            if(remainingPoints == 0)break;
            int available =lp.getPoints();
            if(available < remainingPoints){
                //consumimos todo el bloque
                lp.setStatus(LoyaltyPointStatus.USED);
                lp.setPoints(0);
                remainingPoints-=available;
            }else{
                //consumimos parcialmente --  dejar bloque con puntos restantes
                lp.setPoints(available-remainingPoints);
                //si lp.setPoints quedo>0, permanece activo
                lp.setStatus(LoyaltyPointStatus.ACTIVE);

                remainingPoints =0;
            }

            loyaltyPointRepository.save(lp);
        }
    }


    // ===== helper interno =====
    private LoyaltyPointHistoryDTO toHistoryDto(LoyaltyPoint p, Integer balance) {
        LoyaltyPointHistoryDTO dto = new LoyaltyPointHistoryDTO();
        dto.setId(p.getId());
        dto.setClientId(p.getClientId());
        dto.setStatus(p.getStatus().name());
        dto.setPoints(p.getPoints());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setExpiresAt(p.getExpiresAt());
        dto.setBalance(balance);
        
        // Inferir type y description
        if (p.getPoints() > 0) {
            dto.setType("earned");
            dto.setDescription("Puntos ganados por compra");
        } else if (p.getPoints() < 0) {
            dto.setType("redeemed");
            dto.setDescription("Canje en compra");
        } else {
            dto.setType("used");
            dto.setDescription("Puntos consumidos");
        }
        
        return dto;
    }
}

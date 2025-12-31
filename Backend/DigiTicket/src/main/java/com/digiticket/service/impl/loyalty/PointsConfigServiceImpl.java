package com.digiticket.service.impl.loyalty;

import com.digiticket.domain.loyalty.PointsConfig;
import com.digiticket.repository.loyalty.PointsConfigRepository;
import com.digiticket.service.loyalty.PointsConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PointsConfigServiceImpl implements PointsConfigService {
    private static final int DEFAULT=10;
    private final PointsConfigRepository repo;

    public PointsConfigServiceImpl(PointsConfigRepository repo) {
        this.repo = repo;
    }

    @Override
    public int getPointsPerUnit() {
        return repo.findById(1)
                .map(PointsConfig::getPointsPerUnit)
                .orElse(DEFAULT);
    }

    @Override
    public void updatePointsPerUnit(int points) {
        PointsConfig cfg = repo.findById(1).orElseGet(()->PointsConfig.builder().id(1).pointsPerUnit(points).build());
        cfg.setPointsPerUnit(points);
        repo.save(cfg);
    }
}

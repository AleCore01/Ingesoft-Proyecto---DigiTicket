package com.digiticket.service.loyalty;

public interface PointsConfigService {
    int getPointsPerUnit();
    void updatePointsPerUnit(int points);
}

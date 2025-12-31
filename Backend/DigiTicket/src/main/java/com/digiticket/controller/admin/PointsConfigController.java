package com.digiticket.controller.admin;

import com.digiticket.domain.loyalty.PointsConfig;
import com.digiticket.service.loyalty.PointsConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/points-config")
public class PointsConfigController {
    private final PointsConfigService svc;

    public PointsConfigController(PointsConfigService svc) { this.svc = svc;}

    @GetMapping
    public ResponseEntity<Integer> get(){
        return ResponseEntity.ok(svc.getPointsPerUnit());
    }

    @PutMapping
    public ResponseEntity<PointsConfig> update(@RequestParam int pointsConfig){
        svc.updatePointsPerUnit(pointsConfig);
        return ResponseEntity.noContent().build();
    }
}

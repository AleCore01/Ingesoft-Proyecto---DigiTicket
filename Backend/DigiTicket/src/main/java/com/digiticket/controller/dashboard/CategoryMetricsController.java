package com.digiticket.controller.dashboard;

import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.service.dashboard.CategoryMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categoryMetrics")
@RequiredArgsConstructor
public class CategoryMetricsController {

    private final CategoryMetricsService categoryMetricsService;

    @GetMapping("/top-categories")
    public ResponseEntity<List<TopCategoryDTO>> getTopCategories(
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(categoryMetricsService.getTopCategories(limit));
    }
}

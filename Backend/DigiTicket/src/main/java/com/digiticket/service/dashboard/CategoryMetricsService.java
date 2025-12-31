package com.digiticket.service.dashboard;

import com.digiticket.dto.dashboard.TopCategoryDTO;

import java.util.List;

public interface CategoryMetricsService {
    List<TopCategoryDTO> getTopCategories(Integer limit);
}

package com.digiticket.service.impl.dashboard;

import com.digiticket.dto.dashboard.TopCategoryDTO;
import com.digiticket.repository.dashboard.CategoryMetricsRepository;
import com.digiticket.service.dashboard.CategoryMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryMetricsServiceImpl implements CategoryMetricsService {

    private final CategoryMetricsRepository categoryMetricsRepository;

    @Override
    public List<TopCategoryDTO> getTopCategories(Integer limit) {

        // Primer día del mes actual (00:00:00)
        LocalDateTime start = LocalDate.now()
                .withDayOfMonth(1)
                .atStartOfDay();

        // Hoy (23:59:59.9999)
        LocalDateTime end = LocalDate.now()
                .atTime(23, 59, 59);

        List<TopCategoryDTO> all =
                categoryMetricsRepository.findTopCategoriesOfCurrentMonth(start, end);

        if (limit != null && limit < all.size()) {
            return all.subList(0, limit);
        }

        return all;
    }
}

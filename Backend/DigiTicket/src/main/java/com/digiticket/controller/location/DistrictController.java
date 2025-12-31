package com.digiticket.controller.location;

import com.digiticket.dto.location.DistrictDTO;
import com.digiticket.service.location.DistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/district")
@RequiredArgsConstructor
public class DistrictController {
    private final DistrictService districtService;

    @GetMapping
    public List<DistrictDTO> getDistricts(@RequestParam(required = false) Integer cityId) {
        if (cityId != null) {
            return districtService.getDistrictsByCity(cityId);
        } else {
            return districtService.getAllDistricts();
        }
    }
}

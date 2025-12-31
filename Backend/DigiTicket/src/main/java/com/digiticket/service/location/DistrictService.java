package com.digiticket.service.location;

import com.digiticket.dto.location.DistrictDTO;

import java.util.List;

public interface DistrictService {
    List<DistrictDTO> getAllDistricts();
    List<DistrictDTO> getDistrictsByCity(Integer cityId);
}

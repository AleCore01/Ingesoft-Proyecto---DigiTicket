package com.digiticket.service.impl.location;

import com.digiticket.dto.location.DistrictDTO;
import com.digiticket.repository.location.DistrictRepository;
import com.digiticket.service.location.DistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DistrictServiceImpl implements DistrictService {
    private final DistrictRepository districtRepository;

    @Override
    public List<DistrictDTO> getAllDistricts() {
        return districtRepository.findAll()
                .stream()
                .map(d -> new DistrictDTO(d.getId(),d.getName()))
                .toList();
    }

    @Override
    public List<DistrictDTO> getDistrictsByCity(Integer cityId) {
        return districtRepository.findByCity_Id(cityId)
                .stream()
                .map(d->new DistrictDTO(d.getId(),d.getName()))
                .toList();
    }
}

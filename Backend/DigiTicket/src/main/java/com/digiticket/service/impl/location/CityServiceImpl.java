package com.digiticket.service.impl.location;

import com.digiticket.dto.location.CityDTO;
import com.digiticket.repository.location.CityRepository;
import com.digiticket.service.location.CityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityServiceImpl implements CityService {
    private final CityRepository cityRepository;

    @Override
    public List<CityDTO> getAllCities() {
        return cityRepository.findAll()
                .stream()
                .map(city ->new CityDTO(city.getId(),city.getName()))
                .toList();
    }
}

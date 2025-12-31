package com.digiticket.controller.location;


import com.digiticket.dto.location.CityDTO;
import com.digiticket.service.location.CityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/city")
@RequiredArgsConstructor
public class CityController {
    private final CityService cityService;

    @GetMapping("/all")
    public List<CityDTO> getAll(){
        return cityService.getAllCities();
    }
}

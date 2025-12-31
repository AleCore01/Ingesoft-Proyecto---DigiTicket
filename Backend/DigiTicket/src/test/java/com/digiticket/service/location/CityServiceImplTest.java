package com.digiticket.service.location;

import com.digiticket.domain.location.City;
import com.digiticket.dto.location.CityDTO;
import com.digiticket.repository.location.CityRepository;
import com.digiticket.service.impl.location.CityServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CityServiceImplTest {

    CityRepository repo = mock(CityRepository.class);
    CityServiceImpl service = new CityServiceImpl(repo);

    @Test
    @DisplayName("getAllCities: mapea City -> CityDTO")
    void getAll_ok() {
        var c1 = City.builder().id(1).name("Lima").build();
        var c2 = City.builder().id(2).name("Arequipa").build();
        when(repo.findAll()).thenReturn(List.of(c1, c2));

        var out = service.getAllCities();

        assertThat(out).extracting(CityDTO::id).containsExactly(1, 2);
        assertThat(out).extracting(CityDTO::name).containsExactly("Lima","Arequipa");
        verify(repo).findAll();
    }
}

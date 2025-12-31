package com.digiticket.service.location;

import com.digiticket.domain.location.District;
import com.digiticket.dto.location.DistrictDTO;
import com.digiticket.repository.location.DistrictRepository;
import com.digiticket.service.impl.location.DistrictServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class DistrictServiceImplTest {

    DistrictRepository repo = mock(DistrictRepository.class);
    DistrictServiceImpl service = new DistrictServiceImpl(repo);

    @Test
    @DisplayName("getAllDistricts: mapea District -> DistrictDTO")
    void all_ok() {
        var d1 = District.builder().id(1).name("Miraflores").build();
        var d2 = District.builder().id(2).name("Surco").build();
        when(repo.findAll()).thenReturn(List.of(d1, d2));

        var out = service.getAllDistricts();

        assertThat(out).extracting(DistrictDTO::id).containsExactly(1, 2);
        assertThat(out).extracting(DistrictDTO::name).containsExactly("Miraflores", "Surco");
        verify(repo).findAll();
    }

    @Test
    @DisplayName("getDistrictsByCity: usa findByCity_Id y mapea")
    void by_city_ok() {
        var d1 = District.builder().id(10).name("Cercado").build();
        var d2 = District.builder().id(11).name("San Isidro").build();
        when(repo.findByCity_Id(1)).thenReturn(List.of(d1, d2));

        var out = service.getDistrictsByCity(1);

        assertThat(out).extracting(DistrictDTO::name)
                .containsExactly("Cercado", "San Isidro");
        verify(repo).findByCity_Id(1);
    }
}

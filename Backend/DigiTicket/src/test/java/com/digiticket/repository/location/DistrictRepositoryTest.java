package com.digiticket.repository.location;

import com.digiticket.domain.location.City;
import com.digiticket.domain.location.District;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DistrictRepositoryTest {

    @Autowired
    CityRepository cityRepo;

    @Autowired
    DistrictRepository districtRepo;

    @Test
    @DisplayName("findByCity_Id retorna solo distritos de la ciudad indicada")
    void findByCityId() {
        City lima = cityRepo.save(City.builder().name("Lima").build());
        City areq = cityRepo.save(City.builder().name("Arequipa").build());

        districtRepo.save(District.builder().name("Miraflores").city(lima).build());
        districtRepo.save(District.builder().name("Surco").city(lima).build());
        districtRepo.save(District.builder().name("Cayma").city(areq).build());

        List<District> limaDs = districtRepo.findByCity_Id(lima.getId());

        assertThat(limaDs)
                .extracting(District::getName)
                .containsExactlyInAnyOrder("Miraflores", "Surco");

        assertThat(limaDs)
                .noneMatch(d -> d.getCity().getId().equals(areq.getId()));
    }
}

package com.digiticket.repository.location;

import com.digiticket.domain.location.City;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
class CityRepositoryTest {

    @Autowired
    CityRepository cityRepo;

    @Test
    @DisplayName("Guarda una ciudad y respeta unique por name")
    void save_unique_name() {
        City lima = City.builder().name("Lima").build();
        cityRepo.saveAndFlush(lima);

        City dup = City.builder().name("Lima").build();

        // Debe reventar por violar la restricción única en name
        assertThatThrownBy(() -> cityRepo.saveAndFlush(dup))
                .isInstanceOf(DataIntegrityViolationException.class);
        // si quieres ser más laxo, puedes dejar .isInstanceOf(Exception.class)
    }
}

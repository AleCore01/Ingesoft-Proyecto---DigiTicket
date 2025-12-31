package com.digiticket.repository.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
class LocationRepositoryTest {

    @Autowired
    LocationRepository repo;

    private Location loc(String name, String addr, String district, int cap, LocationStatus st) {
        return Location.builder()
                .name(name)
                .address(addr)
                .city("Lima")
                .district(district)
                .capacity(cap)
                .status(st)
                .build();
    }

    @Test
    @DisplayName("Unique (name,address) evita duplicados")
    void unique_name_address() {
        repo.saveAndFlush(loc("Coliseo", "Av. 1", "Surco", 1000, LocationStatus.ACTIVE));
        Location dup = loc("Coliseo", "Av. 1", "Surco", 800, LocationStatus.ACTIVE);

        assertThatThrownBy(() -> repo.saveAndFlush(dup))
                .isInstanceOf(Exception.class); // violación de unique constraint
    }

    @Test
    @DisplayName("findByStatus devuelve solo los del estado indicado")
    void findByStatus() {
        repo.save(loc("A", "a", "Surco", 10, LocationStatus.ACTIVE));
        repo.save(loc("B", "b", "Surco", 10, LocationStatus.INACTIVE));

        List<Location> actives = repo.findByStatus(LocationStatus.ACTIVE);

        assertThat(actives)
                .extracting(Location::getName)
                .contains("A")
                .doesNotContain("B");
    }

    @Test
    @DisplayName("findByNameContainingIgnoreCase hace búsqueda por nombre")
    void searchByName() {
        repo.save(loc("Gran Teatro", "x", "Cercado", 500, LocationStatus.ACTIVE));
        repo.save(loc("Pequeño Teatro", "y", "Jesús María", 300, LocationStatus.ACTIVE));

        List<Location> found = repo.findByNameContainingIgnoreCase("teAtro");

        assertThat(found).hasSize(2);
    }

    @Test
    @DisplayName("findById devuelve también inactivo")
    void findById_returnsInactive() {
        Location l = repo.save(loc("Arena", "z", "Breña", 900, LocationStatus.INACTIVE));

        Optional<Location> found = repo.findById(l.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(LocationStatus.INACTIVE);
    }
}

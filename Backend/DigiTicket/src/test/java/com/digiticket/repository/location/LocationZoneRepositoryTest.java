package com.digiticket.repository.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.domain.location.LocationZone;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
//@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class LocationZoneRepositoryTest {

    @Autowired
    LocationRepository locRepo;

    @Autowired
    LocationZoneRepository zoneRepo;

    private Location mkLoc(String name) {
        return locRepo.save(Location.builder()
                .name(name)
                .address(name + " addr")
                .city("Lima")
                .district("Surco")
                .capacity(100)
                .status(LocationStatus.ACTIVE)
                .build());
    }

    private LocationZone mkZone(Location l, String name, int cap) {
        return zoneRepo.save(LocationZone.builder()
                .location(l)
                .name(name)
                .capacity(cap)
                .status(LocationStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Unique (location_id,name) evita duplicados por local")
    void unique_location_name() {
        Location loc = mkLoc("Coliseo");
        mkZone(loc, "VIP", 50);

        LocationZone dup = LocationZone.builder()
                .location(loc)
                .name("VIP")
                .capacity(60)
                .status(LocationStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> zoneRepo.saveAndFlush(dup))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("findByLocationId lista zonas del local")
    void findByLocationId() {
        Location a = mkLoc("A");
        Location b = mkLoc("B");

        mkZone(a, "General", 100);
        mkZone(a, "VIP", 50);
        mkZone(b, "VIP", 30);

        List<LocationZone> ofA = zoneRepo.findByLocationId(a.getId());

        assertThat(ofA)
                .extracting(LocationZone::getName)
                .containsExactlyInAnyOrder("General", "VIP");
    }

    @Test
    @DisplayName("findByLocationIdAndNameIgnoreCase encuentra por nombre case-insensitive")
    void findByLocationIdAndNameIgnoreCase() {
        Location a = mkLoc("A");
        mkZone(a, "Platea", 70);

        assertThat(zoneRepo.findByLocationIdAndNameIgnoreCase(a.getId(), "plAtEa")).isPresent();
        assertThat(zoneRepo.findByLocationIdAndNameIgnoreCase(a.getId(), "boxes")).isEmpty();
    }
}

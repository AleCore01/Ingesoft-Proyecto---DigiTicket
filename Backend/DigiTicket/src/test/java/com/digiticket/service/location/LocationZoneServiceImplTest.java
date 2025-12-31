package com.digiticket.service.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.repository.location.LocationZoneRepository;
import com.digiticket.service.impl.location.LocationZoneServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class LocationZoneServiceImplTest {

    LocationZoneRepository zoneRepo = mock(LocationZoneRepository.class);
    LocationRepository locRepo = mock(LocationRepository.class);
    LocationZoneServiceImpl service = new LocationZoneServiceImpl(zoneRepo, locRepo);

    @Test
    @DisplayName("createZone: crea nueva zona cuando no existe homónima (case-insensitive)")
    void create_new_zone() {
        var loc = Location.builder().id(1).status(LocationStatus.ACTIVE).build();
        when(locRepo.findById(1)).thenReturn(Optional.of(loc));
        when(zoneRepo.findByLocationIdAndNameIgnoreCase(1,"VIP")).thenReturn(Optional.empty());
        when(zoneRepo.save(any(LocationZone.class))).thenAnswer(i -> i.getArgument(0));

        var input = LocationZone.builder().name("VIP").capacity(100).build();
        var out = service.createZone(1, input);

        assertThat(out.getLocation()).isEqualTo(loc);
        assertThat(out.getStatus()).isEqualTo(LocationStatus.ACTIVE);
        verify(zoneRepo).save(any(LocationZone.class));
    }

    @Test
    @DisplayName("createZone: re-activa si existe INACTIVE con mismo nombre")
    void create_reactivate_existing_inactive() {
        var loc = Location.builder().id(1).status(LocationStatus.ACTIVE).build();
        var existing = LocationZone.builder()
                .id(9).name("General").status(LocationStatus.INACTIVE).capacity(10).build();

        when(locRepo.findById(1)).thenReturn(Optional.of(loc));
        when(zoneRepo.findByLocationIdAndNameIgnoreCase(1,"General")).thenReturn(Optional.of(existing));
        when(zoneRepo.save(any(LocationZone.class))).thenAnswer(i -> i.getArgument(0));

        var input = LocationZone.builder().name("General").capacity(500).build();
        var out = service.createZone(1, input);

        assertThat(out.getId()).isEqualTo(9);
        assertThat(out.getStatus()).isEqualTo(LocationStatus.ACTIVE);
        assertThat(out.getCapacity()).isEqualTo(500);
    }

    @Test
    @DisplayName("createZone: falla si local está INACTIVE")
    void create_fails_if_location_inactive() {
        var loc = Location.builder().id(1).status(LocationStatus.INACTIVE).build();
        when(locRepo.findById(1)).thenReturn(Optional.of(loc));

        var input = LocationZone.builder().name("VIP").capacity(100).build();

        assertThatThrownBy(() -> service.createZone(1, input))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot activate location");
    }

    @Test
    @DisplayName("createZone: falla si ya existe zona activa con el mismo nombre")
    void create_fails_if_duplicate_active_zone() {
        var loc = Location.builder().id(1).status(LocationStatus.ACTIVE).build();
        var existing = LocationZone.builder()
                .id(9).name("General").status(LocationStatus.ACTIVE).capacity(10).build();

        when(locRepo.findById(1)).thenReturn(Optional.of(loc));
        when(zoneRepo.findByLocationIdAndNameIgnoreCase(1,"General")).thenReturn(Optional.of(existing));

        var input = LocationZone.builder().name("General").capacity(500).build();

        assertThatThrownBy(() -> service.createZone(1, input))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("updateZone: actualiza nombre y capacidad")
    void update_ok() {
        var ex = LocationZone.builder().id(3).name("Old").capacity(10).build();
        when(zoneRepo.findById(3)).thenReturn(Optional.of(ex));
        when(zoneRepo.save(any(LocationZone.class))).thenAnswer(i -> i.getArgument(0));

        var upd = LocationZone.builder().name("VIP").capacity(999).build();
        var out = service.updateZone(3, upd);

        assertThat(out.getName()).isEqualTo("VIP");
        assertThat(out.getCapacity()).isEqualTo(999);
    }

    @Test
    @DisplayName("deleteZone: soft delete -> status INACTIVE")
    void delete_soft() {
        var ex = LocationZone.builder().id(3).name("VIP").status(LocationStatus.ACTIVE).build();
        when(zoneRepo.findById(3)).thenReturn(Optional.of(ex));
        when(zoneRepo.save(any(LocationZone.class))).thenAnswer(i -> i.getArgument(0));

        service.deleteZone(3);

        assertThat(ex.getStatus()).isEqualTo(LocationStatus.INACTIVE);
        verify(zoneRepo).save(ex);
    }

    @Test
    @DisplayName("getZoneById y getZonesByLocation delegan al repo")
    void delegates_repo() {
        // given
        var dummyZone = new LocationZone();
        when(zoneRepo.findById(7)).thenReturn(Optional.of(dummyZone));
        when(zoneRepo.findByLocationId(1)).thenReturn(List.of(dummyZone));

        // when
        var z = service.getZoneById(7);
        var list = service.getZonesByLocation(1);

        // then
        assertThat(z).isSameAs(dummyZone);
        assertThat(list).hasSize(1);
        verify(zoneRepo).findById(7);
        verify(zoneRepo).findByLocationId(1);
    }

    @Test
    @DisplayName("getZoneById lanza RuntimeException cuando no existe")
    void getZoneById_not_found() {
        when(zoneRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getZoneById(99))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        verify(zoneRepo).findById(99);
    }
}

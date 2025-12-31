package com.digiticket.service.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.service.impl.location.LocationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class LocationServiceImplTest {

    LocationRepository repo = mock(LocationRepository.class);
    EventRepository eventRepo = mock(EventRepository.class);
    LocationServiceImpl service = new LocationServiceImpl(repo,eventRepo);

    @Test
    @DisplayName("createLocation: reactiva si existe igual (name+address) INACTIVE")
    void create_reactivate_inactive() {
        var inactive = Location.builder()
                .id(1).name("Arena").address("Av. 123")
                .status(LocationStatus.INACTIVE).build();

        when(repo.findByNameAndAddress("Arena", "Av. 123")).thenReturn(Optional.of(inactive));
        when(repo.save(any(Location.class))).thenAnswer(i -> i.getArgument(0));

        var input = Location.builder()
                .name("Arena").address("Av. 123")
                .contactEmail("a@b.com").city("Lima").district("Surco")
                .capacity(500).build();

        var out = service.createLocation(input);

        assertThat(out.getStatus()).isEqualTo(LocationStatus.ACTIVE);
        assertThat(out.getContactEmail()).isEqualTo("a@b.com");
        verify(repo).save(inactive);
    }

    @Test
    @DisplayName("createLocation: lanza error si ya existe activo con mismo (name+address)")
    void create_throws_if_active_exists() {
        var active = Location.builder()
                .id(1).name("Arena").address("Av. 123")
                .status(LocationStatus.ACTIVE).build();
        when(repo.findByNameAndAddress("Arena","Av. 123")).thenReturn(Optional.of(active));

        var input = Location.builder().name("Arena").address("Av. 123").build();

        assertThatThrownBy(() -> service.createLocation(input))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Location already exists");
    }

    @Test
    @DisplayName("updateLocation: actualiza campos y conserva id")
    void update_ok() {
        var existing = Location.builder()
                .id(10).name("Old").address("Old Av").city("OldC").district("OldD")
                .capacity(10).status(LocationStatus.ACTIVE).build();

        when(repo.findById(10)).thenReturn(Optional.of(existing));
        when(repo.save(any(Location.class))).thenAnswer(i -> i.getArgument(0));

        var upd = Location.builder()
                .name("New").address("New Av").city("Lima").district("Miraflores")
                .capacity(999).status(LocationStatus.ACTIVE).build();

        var out = service.updateLocation(10, upd);

        assertThat(out.getId()).isEqualTo(10);
        assertThat(out.getName()).isEqualTo("New");
        assertThat(out.getCapacity()).isEqualTo(999);
    }

    @Test
    @DisplayName("updateLocation: lanza error si no existe")
    void update_not_found() {
        when(repo.findById(77)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateLocation(77, new Location()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Location not found");
    }

    @Test
    @DisplayName("deleteLocation: marca INACTIVE y también las zonas")
    void delete_soft_and_zones_inactive() {
        var loc = Location.builder()
                .id(5).name("Stadium").status(LocationStatus.ACTIVE)
                .build();
        // simulamos que getZones() trae algo
        var zone = new com.digiticket.domain.location.LocationZone();
        zone.setStatus(LocationStatus.ACTIVE);
        loc.setZones(List.of(zone));

        when(repo.findById(5)).thenReturn(Optional.of(loc));
        when(repo.save(any(Location.class))).thenAnswer(i -> {
            Location saved = i.getArgument(0);
            // El servicio modifica el objeto antes de guardarlo
            saved.setStatus(LocationStatus.INACTIVE);
            saved.getZones().forEach(z -> z.setStatus(LocationStatus.INACTIVE));
            return saved;
        });

        service.deleteLocation(5);

        // Verificar que se llamó save
        verify(repo).save(argThat(location -> 
            location.getStatus() == LocationStatus.INACTIVE &&
            location.getZones().stream().allMatch(z -> z.getStatus() == LocationStatus.INACTIVE)
        ));
    }

    @Test
    @DisplayName("getLocationById: devuelve el local por id aunque esté INACTIVE")
    void get_by_id_any_status() {
        var inactive = Location.builder()
                .id(1)
                .status(LocationStatus.INACTIVE)
                .build();

        when(repo.findById(1)).thenReturn(Optional.of(inactive));

        var out = service.getLocationById(1);

        assertThat(out.getId()).isEqualTo(1);
        assertThat(out.getStatus()).isEqualTo(LocationStatus.INACTIVE);
    }

    @Test
    @DisplayName("getAll / getByStatus / searchByName delegan al repo")
    void delegates_to_repo() {
        service.getAllLocations();
        verify(repo).findAll(any(org.springframework.data.domain.Sort.class));

        service.getLocationsByStatus(LocationStatus.ACTIVE);
        verify(repo).findByStatus(LocationStatus.ACTIVE);

        service.searchLocationsByName("are");
        verify(repo).findByNameContainingIgnoreCase("are");
    }
}

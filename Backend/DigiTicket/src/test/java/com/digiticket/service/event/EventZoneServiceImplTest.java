package com.digiticket.service.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.repository.location.LocationZoneRepository;
import com.digiticket.service.impl.event.EventZoneServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventZoneServiceImplTest {

    @Mock
    EventZoneRepository zoneRepo;
    @Mock
    EventRepository eventRepo;
    @Mock
    LocationZoneRepository lzRepo;
    @Mock
    LocationRepository locRepo; // (no se usa directo en create, pero está en ctor)
    @InjectMocks EventZoneServiceImpl service;

    @Test
    void createZone_ok_creates_locationZone_and_defaults() {
        // Evento con Location
        var loc = new Location(); loc.setId(11);
        var ev = new Event(); ev.setId(5); ev.setLocation(loc);
        when(eventRepo.findById(5)).thenReturn(Optional.of(ev));

        // LZ saved
        when(lzRepo.save(any(LocationZone.class))).thenAnswer(inv -> {
            var lz = (LocationZone) inv.getArgument(0);
            lz.setId(77);
            return lz;
        });

        // EZ saved
        when(zoneRepo.save(any(EventZone.class))).thenAnswer(inv -> {
            var ez = (EventZone) inv.getArgument(0);
            ez.setId(99);
            return ez;
        });

        var zone = EventZone.builder()
                .event(new Event())       // fantasma con id
                .displayName("VIP")
                .price(java.math.BigDecimal.TEN)
                .seatsQuota(100)
                .seatsSold(null)          // default 0
                .status(null)             // default ACTIVE
                .build();
        zone.getEvent().setId(5);

        var id = service.createZone(zone);

        assertThat(id).isEqualTo(99);
        // Verifica que se creó la LZ con datos derivados
        ArgumentCaptor<LocationZone> cap = ArgumentCaptor.forClass(LocationZone.class);
        verify(lzRepo).save(cap.capture());
        assertThat(cap.getValue().getName()).isEqualTo("VIP");
        assertThat(cap.getValue().getCapacity()).isEqualTo(100);
        assertThat(cap.getValue().getLocation()).isSameAs(loc);

        // Defaults en EventZone
        ArgumentCaptor<EventZone> capEz = ArgumentCaptor.forClass(EventZone.class);
        verify(zoneRepo).save(capEz.capture());
        assertThat(capEz.getValue().getSeatsSold()).isEqualTo(0);
        assertThat(capEz.getValue().getStatus()).isEqualTo(EventZone.Status.ACTIVE);
        assertThat(capEz.getValue().getLocationZone().getId()).isEqualTo(77);
    }

    @Test
    void createZone_event_missing_throws() {
        var zone = EventZone.builder().build();
        assertThatThrownBy(() -> service.createZone(zone))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Event is required");
    }

    @Test
    void updateZone_ok_in_place_and_fk_changes() {
        var existing = EventZone.builder().id(10).seatsQuota(50).seatsSold(10).status(EventZone.Status.ACTIVE).build();
        when(zoneRepo.findById(10)).thenReturn(Optional.of(existing));
        when(zoneRepo.save(existing)).thenReturn(existing);

        var newEvent = new Event(); newEvent.setId(5);
        when(eventRepo.findById(5)).thenReturn(Optional.of(newEvent));

        var newLz = new LocationZone(); newLz.setId(7);
        when(lzRepo.findById(7)).thenReturn(Optional.of(newLz));

        var upd = EventZone.builder()
                .displayName("PLATEA")
                .price(java.math.BigDecimal.valueOf(50))
                .seatsQuota(60)
                .seatsSold(30)
                .status(EventZone.Status.INACTIVE)
                .event(new Event()) // fk update
                .locationZone(new LocationZone())
                .build();
        upd.getEvent().setId(5);
        upd.getLocationZone().setId(7);

        var out = service.updateZone(10, upd);
        assertThat(out.getDisplayName()).isEqualTo("PLATEA");
        assertThat(out.getSeatsQuota()).isEqualTo(60);
        assertThat(out.getSeatsSold()).isEqualTo(30);
        assertThat(out.getStatus()).isEqualTo(EventZone.Status.INACTIVE);
        assertThat(out.getEvent()).isSameAs(newEvent);
        assertThat(out.getLocationZone()).isSameAs(newLz);
    }

    @Test
    void updateZone_sold_greater_than_quota_throws() {
        var existing = EventZone.builder().id(10).seatsQuota(20).build();
        when(zoneRepo.findById(10)).thenReturn(Optional.of(existing));

        var upd = EventZone.builder().seatsSold(25).build();
        assertThatThrownBy(() -> service.updateZone(10, upd))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("seatsSold");
    }

    @Test
    void deleteZone_ok_and_not_found() {
        when(zoneRepo.existsById(5)).thenReturn(true);
        service.deleteZone(5);
        verify(zoneRepo).deleteById(5);

        when(zoneRepo.existsById(6)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteZone(6))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getZoneById_ok_and_not_found() {
        var z = new EventZone(); z.setId(1);
        when(zoneRepo.findById(1)).thenReturn(Optional.of(z));
        assertThat(service.getZoneById(1)).isSameAs(z);

        when(zoneRepo.findById(9)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getZoneById(9))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getZonesByEvent_validates_event_exists_then_queries() {
        when(eventRepo.findById(3)).thenReturn(Optional.of(new Event()));
        service.getZonesByEvent(3);
        verify(zoneRepo).findByEvent_Id(3);
    }

    @Test
    void getAvailable_prefers_column_then_fallback() {
        var z = new EventZone();
        z.setSeatsQuota(100); z.setSeatsSold(30);
        z.setStatus(EventZone.Status.ACTIVE);

        // Caso 1: seatsAvailable presente (simula columna calculada)
        var z1 = new EventZone(); z1.setSeatsAvailable(40);
        when(zoneRepo.findFirstByEvent_IdAndLocationZone_Id(1, 2)).thenReturn(Optional.of(z1));
        assertThat(service.getAvailable(1,2)).isEqualTo(40);

        // Caso 2: null -> fallback quota - sold
        when(zoneRepo.findFirstByEvent_IdAndLocationZone_Id(1, 3)).thenReturn(Optional.of(z));
        assertThat(service.getAvailable(1,3)).isEqualTo(70);

        // Caso 3: no existe → 0
        when(zoneRepo.findFirstByEvent_IdAndLocationZone_Id(1, 4)).thenReturn(Optional.empty());
        assertThat(service.getAvailable(1,4)).isEqualTo(0);
    }
}

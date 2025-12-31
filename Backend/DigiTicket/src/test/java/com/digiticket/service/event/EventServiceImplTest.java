package com.digiticket.service.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventCategory;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.user.Administrator;
import com.digiticket.repository.user.AdministratorRepository;
import com.digiticket.repository.event.EventCategoryRepository;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.service.impl.event.EventServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventServiceImplTest {

    @Mock EventRepository eventRepo;
    @Mock LocationRepository locationRepo;
    @Mock EventCategoryRepository categoryRepo;
    @Mock AdministratorRepository adminRepo;

    @InjectMocks EventServiceImpl service;

    @Test
    void createEvent_ok_sets_defaults_and_saves() {
        // Arrange
        var loc = new Location(); loc.setId(1);
        var cat = new EventCategory(); cat.setId(2);
        var adm = new Administrator(); adm.setId(3);

        when(locationRepo.findById(1)).thenReturn(Optional.of(loc));
        when(categoryRepo.findById(2)).thenReturn(Optional.of(cat));
        when(adminRepo.findById(3)).thenReturn(Optional.of(adm));
        when(eventRepo.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        var e = Event.builder()
                .title("Show")
                .description("Desc")
                .startsAt(LocalDateTime.now().plusDays(1))
                .durationMin(120)
                .location(loc)
                .eventCategory(cat)
                .administrator(adm)
                .status(null)            // debe poner DRAFT
                .salesStartAt(null)      // debe poner startsAt (o now)
                .build();

        // Act
        var saved = service.createEvent(e);

        // Assert
        assertThat(saved.getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(saved.getSalesStartAt()).isNotNull();
        verify(eventRepo).save(any(Event.class));
    }

    @Test
    void createEvent_missing_fk_throws() {
        var e = Event.builder().title("x").build();
        assertThatThrownBy(() -> service.createEvent(e))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Location is required");
    }

    @Test
    void updateEvent_ok_updates_fields_and_fks() {
        var existing = new Event(); existing.setId(10);
        when(eventRepo.findById(10)).thenReturn(Optional.of(existing));

        var loc = new Location(); loc.setId(1);
        when(locationRepo.findById(1)).thenReturn(Optional.of(loc));
        var cat = new EventCategory(); cat.setId(2);
        when(categoryRepo.findById(2)).thenReturn(Optional.of(cat));
        var adm = new Administrator(); adm.setId(3);
        when(adminRepo.findById(3)).thenReturn(Optional.of(adm));

        var upd = Event.builder()
                .title("Nuevo")
                .description("D")
                .startsAt(LocalDateTime.now().plusDays(2))
                .salesStartAt(LocalDateTime.now().plusDays(1))
                .durationMin(90)
                .location(loc)
                .eventCategory(cat)
                .administrator(adm)
                .status(EventStatus.PUBLISHED)
                .build();

        when(eventRepo.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        var out = service.updateEvent(10, upd);

        assertThat(out.getTitle()).isEqualTo("Nuevo");
        assertThat(out.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(out.getLocation()).isSameAs(loc);
        assertThat(out.getEventCategory()).isSameAs(cat);
        assertThat(out.getAdministrator()).isSameAs(adm);
        verify(eventRepo).save(existing);
    }

    @Test
    void updateEvent_not_found() {
        when(eventRepo.findById(99)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateEvent(99, new Event()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Event not found");
    }

    @Test
    void deleteEvent_ok() {
        when(eventRepo.existsById(5)).thenReturn(true);
        service.deleteEvent(5);
        verify(eventRepo).deleteById(5);
    }

    @Test
    void deleteEvent_not_found() {
        when(eventRepo.existsById(7)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteEvent(7))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Event not found");
    }

    @Test
    void publish_cancel_finish() {
        var e = new Event(); e.setId(1);
        when(eventRepo.findById(1)).thenReturn(Optional.of(e));
        when(eventRepo.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.publishEvent(1).getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(service.cancelEvent(1).getStatus()).isEqualTo(EventStatus.CANCELED);
        assertThat(service.finishEvent(1).getStatus()).isEqualTo(EventStatus.FINISHED);
    }

    @Test
    void searchEvents_delegates_spec() {
        service.searchEvents("rock", EventStatus.DRAFT, 1, LocalDateTime.now(), LocalDateTime.now().plusDays(1));
        verify(eventRepo).findAll(any(Specification.class)); // Specification
    }
}

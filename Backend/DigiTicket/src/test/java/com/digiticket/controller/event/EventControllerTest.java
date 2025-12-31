package com.digiticket.controller.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventCategory;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.user.Administrator;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.event.EventService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
@WebMvcTest(controllers = EventController.class)
@AutoConfigureMockMvc(addFilters = false)
public class EventControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    EventService service;

    private Event sampleEvent(Integer id) {
        var loc = Location.builder().id(1).build();
        var cat = EventCategory.builder().id(2).name("Música").build();
        var adm = Administrator.builder().id(3).build();

        return Event.builder()
                .id(id)
                .title("Concierto X")
                .description("Detalle")
                .startsAt(LocalDateTime.parse("2025-12-01T20:00:00"))
                .salesStartAt(LocalDateTime.parse("2025-11-01T10:00:00"))
                .durationMin(120)
                .location(loc)
                .eventCategory(cat)
                .administrator(adm)
                .status(EventStatus.DRAFT)
                .build();
    }

    @Test
    @DisplayName("POST /api/event/add -> 201 con DTO válido")
    void create_ok() throws Exception {
        var req = """
                {
                  "title":"Concierto X",
                  "description":"Detalle",
                  "startsAt":"2025-12-01T20:00:00",
                  "salesStartAt":"2025-11-01T10:00:00",
                  "durationMin":120,
                  "locationId":1,
                  "eventCategoryId":2,
                  "administratorId":3,
                  "status":"DRAFT"
                }
                """;

        given(service.createEvent(any(Event.class))).willReturn(sampleEvent(10));

        mvc.perform(post("/api/event/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(req))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.title", is("Concierto X")))
                .andExpect(jsonPath("$.eventCategoryId", is(2)));
    }

    @Test
    @DisplayName("POST /api/event/add -> 500 cuando service lanza excepción")
    void create_error() throws Exception {
        var req = """
                {"title":"A", "durationMin":60, "locationId":1, "eventCategoryId":2, "administratorId":3}
                """;
        given(service.createEvent(any(Event.class)))
                .willThrow(new RuntimeException("Location not found with id 1"));

        mvc.perform(post("/api/event/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(req))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error", is("RuntimeException")))
                .andExpect(jsonPath("$.message", containsString("Location not found")));
    }

    @Test
    @DisplayName("GET /api/event/all -> 200 lista mapeada a DTO")
    void all_ok() throws Exception {
        given(service.getAllEvents()).willReturn(List.of(sampleEvent(1), sampleEvent(2)));

        mvc.perform(get("/api/event/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].locationId", is(1)));
    }

    @Test
    @DisplayName("GET /api/event/{id} -> 200 cuando existe")
    void getById_ok() throws Exception {
        given(service.getEventById(7)).willReturn(sampleEvent(7));

        mvc.perform(get("/api/event/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(7)))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    @DisplayName("GET /api/event/{id} -> 400/404 cuando no existe")
    void getById_not_found() throws Exception {
        given(service.getEventById(77))
                .willThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event not found with id 77"));

        mvc.perform(get("/api/event/77"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Event not found")));
    }


    @Test
    @DisplayName("PUT /api/event/update/{id} -> 200 actualización OK")
    void update_ok() throws Exception {
        var req = """
                {
                  "title":"Concierto Y",
                  "description":"Nuevo",
                  "startsAt":"2025-12-02T20:00:00",
                  "durationMin":90,
                  "locationId":1,
                  "eventCategoryId":2,
                  "administratorId":3,
                  "status":"PUBLISHED"
                }
                """;
        var updated = sampleEvent(5);
        updated.setTitle("Concierto Y");
        updated.setStatus(EventStatus.PUBLISHED);

        given(service.updateEvent(eq(5), any(Event.class))).willReturn(updated);

        mvc.perform(put("/api/event/update/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(req))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Concierto Y")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
    }

    @Test
    @DisplayName("DELETE /api/event/delete/{id} -> 200/204 y delega")
    void delete_ok() throws Exception {
        mvc.perform(delete("/api/event/delete/9"))
                .andExpect(status().isOk()); // o NoContent si cambias el controller
        verify(service).deleteEvent(9);
    }

    @Test
    @DisplayName("POST /api/event/{id}/publish|cancel|finish -> 200")
    void state_changes_ok() throws Exception {
        var published = sampleEvent(4);
        published.setStatus(EventStatus.PUBLISHED);
        var canceled = sampleEvent(4);
        canceled.setStatus(EventStatus.CANCELED);
        var finished = sampleEvent(4);
        finished.setStatus(EventStatus.FINISHED);

        given(service.publishEvent(4)).willReturn(published);
        given(service.cancelEvent(4)).willReturn(canceled);
        given(service.finishEvent(4)).willReturn(finished);

        mvc.perform(post("/api/event/4/publish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")));

        mvc.perform(post("/api/event/4/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELED")));

        mvc.perform(post("/api/event/4/finish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("FINISHED")));
    }

    @Test
    @DisplayName("GET /api/event/search -> 200 con parámetros title/status/location/rango")
    void search_ok() throws Exception {
        given(service.searchEvents(eq("concierto"), eq(EventStatus.PUBLISHED), eq(1),
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .willReturn(List.of(sampleEvent(1)));

        mvc.perform(get("/api/event/search")
                        .param("title", "concierto")
                        .param("status", "PUBLISHED")
                        .param("locationId", "1")
                        .param("from", "2025-11-01T00:00:00")
                        .param("to", "2025-12-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)));
    }
}

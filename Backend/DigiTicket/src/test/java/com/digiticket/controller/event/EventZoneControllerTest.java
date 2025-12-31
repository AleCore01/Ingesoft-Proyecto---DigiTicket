package com.digiticket.controller.event;

import com.digiticket.domain.event.EventZone;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.event.AvailabilityService;
import com.digiticket.service.event.EventZoneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class EventZoneControllerTest {

    @Mock
    EventZoneService service;
    @Mock
    AvailabilityService availabilityService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        // OJO: aquí asumimos que EventZoneController tiene un constructor
        // EventZoneController(EventZoneService service).
        // Si no lo tiene, habría que inyectar el mock con ReflectionTestUtils.
        var controller = new EventZoneController(service,availabilityService);

        this.mvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private EventZone ez(Integer id) {
        var z = new EventZone();
        z.setId(id);
        z.setDisplayName("VIP");
        z.setPrice(new BigDecimal("150.00"));
        z.setSeatsQuota(100);
        z.setSeatsSold(10);
        z.setStatus(EventZone.Status.ACTIVE);
        return z;
    }

    @Test
    @DisplayName("POST /api/eventzone/add -> 200 retorna id cuando DTO válido")
    void create_ok() throws Exception {
        var body = """
                {
                  "eventId": 5,
                  "displayName":"VIP",
                  "price":150.00,
                  "seatsQuota":100,
                  "seatsSold": 0,
                  "status":"ACTIVE"
                }
                """;
        given(service.createZone(any(EventZone.class))).willReturn(42);

        mvc.perform(post("/api/eventzone/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(content().string("42"));
    }

    @Test
    @DisplayName("POST /api/eventzone/add -> 400/500 cuando falta eventId")
    void create_missing_eventId() throws Exception {
        var body = """
                {
                  "displayName":"VIP",
                  "price":150.00,
                  "seatsQuota":100
                }
                """;

        mvc.perform(post("/api/eventzone/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is5xxServerError());
        // según tu GlobalExceptionHandler esto podría cambiar a 400,
        // pero mantenemos lo que ya habías puesto.
    }

    @Test
    @DisplayName("GET /api/eventzone/all -> 200 lista")
    void all_ok() throws Exception {
        given(service.getAllZones()).willReturn(List.of(ez(1), ez(2)));

        mvc.perform(get("/api/eventzone/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].displayName", is("VIP")));
    }

    @Test
    @DisplayName("GET /api/eventzone/{id} -> 200 cuando existe")
    void getById_ok() throws Exception {
        given(service.getZoneById(9)).willReturn(ez(9));

        mvc.perform(get("/api/eventzone/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(9)))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("GET /api/eventzone/{id} -> 404 cuando service retorna null")
    void getById_notFound_controllerNull() throws Exception {
        given(service.getZoneById(99)).willReturn(null);

        mvc.perform(get("/api/eventzone/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/eventzone/update/{id} -> 200 cuando actualiza")
    void update_ok() throws Exception {
        var body = """
                { "displayName":"PLATEA", "price":120.00, "seatsQuota":80, "seatsSold":5, "status":"ACTIVE" }
                """;
        var updated = ez(7);
        updated.setDisplayName("PLATEA");
        updated.setPrice(new BigDecimal("120.00"));

        given(service.getZoneById(7)).willReturn(ez(7));
        given(service.updateZone(eq(7), any(EventZone.class))).willReturn(updated);

        mvc.perform(put("/api/eventzone/update/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName", is("PLATEA")))
                .andExpect(jsonPath("$.price", is(120.00)));
    }

    @Test
    @DisplayName("PUT /api/eventzone/update/{id} -> 404 cuando no existe")
    void update_notFound() throws Exception {
        var body = """
                { "displayName":"PLATEA" }
                """;
        given(service.getZoneById(777)).willReturn(null);

        mvc.perform(put("/api/eventzone/update/777")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/eventzone/delete/{id} -> 204")
    void delete_ok() throws Exception {
        mvc.perform(delete("/api/eventzone/delete/3"))
                .andExpect(status().isNoContent());

        verify(service).deleteZone(3);
    }

    @Test
    @DisplayName("GET /api/eventzone/list/{eventId} -> 200 lista por evento")
    void listByEvent_ok() throws Exception {
        given(service.getZonesByEvent(5)).willReturn(List.of(ez(1)));

        mvc.perform(get("/api/eventzone/list/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(1)));
    }

    @Test
    @DisplayName("GET /api/eventzone/available?eventId=&zoneId= -> 200 con entero")
    void available_ok() throws Exception {
        given(service.getAvailable(5, 11)).willReturn(73);

        mvc.perform(get("/api/eventzone/available")
                        .param("eventId", "5")
                        .param("zoneId", "11"))
                .andExpect(status().isOk())
                .andExpect(content().string("73"));
    }
}

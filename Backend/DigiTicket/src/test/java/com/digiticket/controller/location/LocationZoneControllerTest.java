package com.digiticket.controller.location;

import com.digiticket.domain.location.LocationZone;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.location.LocationZoneService;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = LocationZoneController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
//@Disabled("Temporalmente deshabilitado: falla el ApplicationContext por configuración de BD de test")
public class LocationZoneControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    LocationZoneService zoneService;

    @Test
    @DisplayName("POST /api/localzone/add -> 200 OK crea zona")
    void create_ok() throws Exception {
        var reqJson = """
            {"name":"VIP","capacity":100}
        """;

        var created = LocationZone.builder()
                .id(10)
                .name("VIP")
                .capacity(100)
                .build();

        given(zoneService.createZone(eq(1), any(LocationZone.class))).willReturn(created);

        mvc.perform(post("/api/localzone/add")
                        .param("locationId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.name", is("VIP")))
                .andExpect(jsonPath("$.capacity", is(100)));
    }

    @Test
    @DisplayName("POST /api/localzone/add -> 500 cuando servicio lanza excepción (duplicado, inactivo, etc.)")
    void create_error() throws Exception {
        var reqJson = """
            {"name":"VIP","capacity":100}
        """;

        given(zoneService.createZone(eq(1), any(LocationZone.class)))
                .willThrow(new RuntimeException("Zone with the same name already exists"));

        mvc.perform(post("/api/localzone/add")
                        .param("locationId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }

    @Test
    @DisplayName("GET /api/localzone/{id} -> 200 OK devuelve zona")
    void getById_ok() throws Exception {
        var zone = LocationZone.builder()
                .id(20)
                .name("GENERAL")
                .capacity(500)
                .build();

        given(zoneService.getZoneById(20)).willReturn(zone);

        mvc.perform(get("/api/localzone/{id}", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(20)))
                .andExpect(jsonPath("$.name", is("GENERAL")))
                .andExpect(jsonPath("$.capacity", is(500)));
    }

    @Test
    @DisplayName("GET /api/localzone/{id} -> 500 cuando no existe")
    void getById_notFound() throws Exception {
        given(zoneService.getZoneById(999))
                .willThrow(new RuntimeException("LocationZone not found with id 999"));

        mvc.perform(get("/api/localzone/{id}", 999))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }

    @Test
    @DisplayName("PUT /api/localzone/update/{id} -> 200 OK actualiza zona")
    void update_ok() throws Exception {
        var reqJson = """
            {"name":"PLATEA","capacity":350}
        """;

        var updated = LocationZone.builder()
                .id(30)
                .name("PLATEA")
                .capacity(350)
                .build();

        given(zoneService.updateZone(eq(30), any(LocationZone.class))).willReturn(updated);

        mvc.perform(put("/api/localzone/update/{id}", 30)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(30)))
                .andExpect(jsonPath("$.name", is("PLATEA")))
                .andExpect(jsonPath("$.capacity", is(350)));
    }

    @Test
    @DisplayName("DELETE /api/localzone/delete/{id} -> 204 No Content elimina (soft) zona")
    void delete_ok() throws Exception {
        doNothing().when(zoneService).deleteZone(40);

        mvc.perform(delete("/api/localzone/delete/{id}", 40))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/localzone/delete/{id} -> 500 cuando servicio falla")
    void delete_error() throws Exception {
        doThrow(new RuntimeException("Zone not found with id 41"))
                .when(zoneService).deleteZone(41);

        mvc.perform(delete("/api/localzone/delete/{id}", 41))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }

    @Test
    @DisplayName("GET /api/localzone/list/{locationId} -> 200 OK lista zonas por local")
    void list_by_location_ok() throws Exception {
        var z1 = LocationZone.builder().id(1).name("VIP").capacity(100).build();
        var z2 = LocationZone.builder().id(2).name("GENERAL").capacity(500).build();

        given(zoneService.getZonesByLocation(5)).willReturn(List.of(z1, z2));

        mvc.perform(get("/api/localzone/list/{locationId}", 5))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(2)))
                .andExpect(jsonPath("$[0].name", is("VIP")))
                .andExpect(jsonPath("$[1].capacity", is(500)));
    }
}

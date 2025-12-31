package com.digiticket.controller.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.location.LocationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = LocationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
//@Disabled("Temporalmente deshabilitado: falla el ApplicationContext por configuración de BD de test")
public class LocationControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    LocationService locationService;

    private Location sample(Integer id) {
        return Location.builder()
                .id(id)
                .name("Arena 1")
                .contactEmail("contact@arena1.com")
                .address("Av. Costanera 123")
                .city("Lima")
                .district("San Miguel")
                .capacity(5000)
                .status(LocationStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("POST /api/local/add -> 200 OK (crea Location)")
    void create_ok() throws Exception {
        var body = """
            {
              "name":"Arena 1",
              "contactEmail":"contact@arena1.com",
              "address":"Av. Costanera 123",
              "city":"Lima",
              "district":"San Miguel",
              "capacity":5000,
              "status":"ACTIVE"
            }
            """;
        given(locationService.createLocation(Mockito.any(Location.class))).willReturn(sample(10));

        mvc.perform(post("/api/local/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.name", is("Arena 1")))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("POST /api/local/add -> 500 cuando negocio lanza RuntimeException (duplicado activo)")
    void create_duplicate() throws Exception {
        var body = """
            {
              "name":"Arena 1",
              "address":"Av. Costanera 123",
              "city":"Lima",
              "district":"San Miguel",
              "capacity":5000,
              "status":"ACTIVE"
            }
            """;
        given(locationService.createLocation(any(Location.class)))
                .willThrow(new RuntimeException("Location already exists and  is active"));

        mvc.perform(post("/api/local/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /api/local/all -> 200 lista de locations")
    void getAll_ok() throws Exception {
        given(locationService.getAllLocations()).willReturn(List.of(sample(1), sample(2)));

        mvc.perform(get("/api/local/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)));
    }

    @Test
    @DisplayName("GET /api/local/{id} -> 200 cuando existe y está ACTIVE")
    void getById_ok() throws Exception {
        given(locationService.getLocationById(7)).willReturn(sample(7));

        mvc.perform(get("/api/local/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(7)))
                .andExpect(jsonPath("$.name", is("Arena 1")));
    }

    @Test
    @DisplayName("GET /api/local/{id} -> 500 cuando no existe o INACTIVE (regla actual)")
    void getById_notFound() throws Exception {
        given(locationService.getLocationById(99))
                .willThrow(new RuntimeException("Location not found or inactive"));

        mvc.perform(get("/api/local/99"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("PUT /api/local/update/{id} -> 200 actualiza OK")
    void update_ok() throws Exception {
        var body = """
            {
              "name":"Arena 1 - Edit",
              "contactEmail":"new@arena1.com",
              "address":"Av. Costanera 789",
              "city":"Lima",
              "district":"San Miguel",
              "capacity":6000,
              "status":"ACTIVE"
            }
            """;
        var updated = sample(5);
        updated.setName("Arena 1 - Edit");
        updated.setContactEmail("new@arena1.com");
        updated.setAddress("Av. Costanera 789");
        updated.setCapacity(6000);

        given(locationService.updateLocation(eq(5), any(Location.class))).willReturn(updated);

        mvc.perform(put("/api/local/update/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(5)))
                .andExpect(jsonPath("$.name", is("Arena 1 - Edit")))
                .andExpect(jsonPath("$.capacity", is(6000)));
    }

    @Test
    @DisplayName("PUT /api/local/update/{id} -> 500 cuando id no existe (regla actual)")
    void update_not_found() throws Exception {
        var body = """
            {"name":"Arena X","address":"Dir","city":"Lima","district":"San Miguel","capacity":100,"status":"ACTIVE"}
            """;
        given(locationService.updateLocation(eq(404), any(Location.class)))
                .willThrow(new RuntimeException("Location not found with id 404"));

        mvc.perform(put("/api/local/update/404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("DELETE /api/local/delete/{id} -> 204 No Content")
    void delete_ok() throws Exception {
        mvc.perform(delete("/api/local/delete/3"))
                .andExpect(status().isNoContent());

        Mockito.verify(locationService).deleteLocation(3);
    }

    @Test
    @DisplayName("DELETE /api/local/delete/{id} -> 500 cuando id no existe (regla actual)")
    void delete_not_found() throws Exception {
        doThrow(new RuntimeException("Location not found with id 777"))
                .when(locationService).deleteLocation(777);

        mvc.perform(delete("/api/local/delete/777"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /api/local/search/name?name=arena -> 200 lista filtrada")
    void searchByName_ok() throws Exception {
        given(locationService.searchLocationsByName("arena"))
                .willReturn(List.of(sample(1)));

        mvc.perform(get("/api/local/search/name")
                        .param("name", "arena"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name", is("Arena 1")));
    }

    @Test
    @DisplayName("GET /api/local/search/status/{status} -> 200 lista por estado")
    void searchStatus_ok() throws Exception {
        given(locationService.getLocationsByStatus(LocationStatus.ACTIVE))
                .willReturn(List.of(sample(11)));

        mvc.perform(get("/api/local/search/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status", is("ACTIVE")));
    }
}

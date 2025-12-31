package com.digiticket.controller.location;

import com.digiticket.dto.location.DistrictDTO;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.location.DistrictService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = DistrictController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
//@Disabled("Temporalmente deshabilitado: falla el ApplicationContext por configuración de BD de test")
public class DistrictControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    DistrictService districtService;

    @Test
    @DisplayName("GET /api/district -> 200 OK lista todos los distritos (sin cityId)")
    void getAll_ok() throws Exception {
        var d1 = new DistrictDTO(1, "Miraflores");
        var d2 = new DistrictDTO(2, "Surco");
        given(districtService.getAllDistricts()).willReturn(List.of(d1, d2));

        mvc.perform(get("/api/district"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Miraflores")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].name", is("Surco")));
    }

    @Test
    @DisplayName("GET /api/district?cityId=1 -> 200 OK lista distritos por ciudad")
    void getByCity_ok() throws Exception {
        var d1 = new DistrictDTO(10, "Cercado de Lima");
        var d2 = new DistrictDTO(11, "San Isidro");
        given(districtService.getDistrictsByCity(1)).willReturn(List.of(d1, d2));

        mvc.perform(get("/api/district").param("cityId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(10)))
                .andExpect(jsonPath("$[0].name", is("Cercado de Lima")))
                .andExpect(jsonPath("$[1].id", is(11)))
                .andExpect(jsonPath("$[1].name", is("San Isidro")));
    }

    @Test
    @DisplayName("GET /api/district -> 500 cuando el servicio falla")
    void get_error() throws Exception {
        doThrow(new RuntimeException("Query error"))
                .when(districtService).getAllDistricts();

        mvc.perform(get("/api/district"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }

    @Test
    @DisplayName("GET /api/district?cityId=99 -> 500 cuando el servicio falla en filtro por ciudad")
    void getByCity_error() throws Exception {
        doThrow(new RuntimeException("City not found"))
                .when(districtService).getDistrictsByCity(99);

        mvc.perform(get("/api/district").param("cityId", "99"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }
}

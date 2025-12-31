package com.digiticket.controller.location;

import com.digiticket.dto.location.CityDTO;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.location.CityService;
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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = CityController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
//@Disabled("Temporalmente deshabilitado: falla el ApplicationContext por configuración de BD de test")
public class CityControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    CityService cityService;

    @Test
    @DisplayName("GET /api/city/all -> 200 OK con lista de ciudades")
    void getAll_ok() throws Exception {
        var c1 = new CityDTO(1, "Lima");
        var c2 = new CityDTO(2, "Arequipa");
        given(cityService.getAllCities()).willReturn(List.of(c1, c2));

        mvc.perform(get("/api/city/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Lima")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].name", is("Arequipa")));
    }

    @Test
    @DisplayName("GET /api/city/all -> 500 cuando el servicio falla")
    void getAll_error() throws Exception {
        doThrow(new RuntimeException("DB down")).when(cityService).getAllCities();

        mvc.perform(get("/api/city/all"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message", containsString("Ocurrió un error inesperado")));
    }
}

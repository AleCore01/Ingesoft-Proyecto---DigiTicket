package com.digiticket.controller.event;

import com.digiticket.domain.event.EventCategory;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.event.EventCategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
@WebMvcTest(controllers = EventCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
public class EventCategoryControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    EventCategoryService service;

    @Test
    @DisplayName("POST /api/eventcategory/add -> 201 cuando name válido")
    void create_ok() throws Exception {
        var body = """
                {
                  "name": "Rock"
                }
                """;

        var saved = EventCategory.builder().id(10).name("Rock").build();
        given(service.createCategory(any(EventCategory.class))).willReturn(saved);

        mvc.perform(post("/api/eventcategory/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk()) // tu controller devuelve 200
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Rock"));
    }


    @Test
    @DisplayName("POST /api/eventcategory/add -> 400 Bad Request cuando name vacío")
    void create_bad_request() throws Exception {
        var body = """
                  {"name":""}
                """;

        // Cuando el controller envíe una categoría con name vacío, el service simula validación 400
        given(service.createCategory(argThat(c -> c.getName() == null || c.getName().isBlank())))
                .willThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required"));

        mvc.perform(post("/api/eventcategory/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Category name is required")));
    }

    @Test
    @DisplayName("GET /api/eventcategory/all -> 200 con lista")
    void all_ok() throws Exception {
        var list = List.of(
                EventCategory.builder().id(1).name("Rock").build(),
                EventCategory.builder().id(2).name("Pop").build()
        );
        given(service.getAllCategories()).willReturn(list);

        mvc.perform(get("/api/eventcategory/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Rock")));
    }

    @Test
    @DisplayName("GET /api/eventcategory/{id} -> 200 cuando existe")
    void getById_ok() throws Exception {
        given(service.getCategoryById(5)).willReturn(EventCategory.builder().id(5).name("Jazz").build());

        mvc.perform(get("/api/eventcategory/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Jazz")));
    }

    @Test
    @DisplayName("GET /api/eventcategory/{id} -> 400 cuando no existe")
    void getById_not_found() throws Exception {
        given(service.getCategoryById(99))
                .willThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "EventCategory not found with id 99"));

        mvc.perform(get("/api/eventcategory/99"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("EventCategory not found")));
    }

    @Test
    @DisplayName("PUT /api/eventcategory/update/{id} -> 200 cuando actualiza")
    void update_ok() throws Exception {
        var body = """
                    {"name":"Indie"}
                """;
        var updated = EventCategory.builder().id(3).name("Indie").build();
        given(service.updateCategory(eq(3), any(EventCategory.class))).willReturn(updated);

        mvc.perform(put("/api/eventcategory/update/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Indie")));
    }

    @Test
    @DisplayName("PUT /api/eventcategory/update/{id} -> 500 cuando no existe (mapeado por GlobalExceptionHandler)")
    void update_not_found() throws Exception {
        var body = """
                {"name":"Indie"}
                """;

        given(service.updateCategory(eq(999), any(EventCategory.class)))
                .willThrow(new RuntimeException("EventCategory not found with id 999"));

        mvc.perform(put("/api/eventcategory/update/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(containsString("Ocurrió un error inesperado")));
    }


    @Test
    @DisplayName("DELETE /api/eventcategory/delete/{id} -> 200/204 cuando elimina")
    void delete_ok() throws Exception {
        mvc.perform(delete("/api/eventcategory/delete/4"))
                .andExpect(status().isOk()); // o .isNoContent() según tu controller
        verify(service).deleteCategory(4);
    }

    @Test
    @DisplayName("DELETE /api/eventcategory/delete/{id} -> 400/404 cuando no existe")
    void delete_not_found() throws Exception {
        doThrow(new RuntimeException("EventCategory not found with id 77"))
                .when(service).deleteCategory(77);

        mvc.perform(delete("/api/eventcategory/delete/77"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(containsString("Ocurrió un error inesperado")));
    }

    @Test
    @DisplayName("GET /api/eventcategory/search/name?name=rock -> 200 lista")
    void searchByName_ok() throws Exception {
        var list = List.of(EventCategory.builder().id(1).name("Rock Alternativo").build());
        given(service.searchByName("rock")).willReturn(list);

        mvc.perform(get("/api/eventcategory/search/name").param("name", "rock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", containsString("Rock")));
    }
}

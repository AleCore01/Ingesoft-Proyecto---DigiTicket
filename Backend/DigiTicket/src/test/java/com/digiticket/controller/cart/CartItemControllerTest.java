package com.digiticket.controller.cart;

import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.CartItemDTO;
import com.digiticket.exception.GlobalExceptionHandler;
import com.digiticket.service.cart.CartItemService;
import com.digiticket.service.cart.CartService;
import org.junit.Ignore;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
@WebMvcTest(controllers = {
        CartController.class,
        CartItemController.class
})
@AutoConfigureMockMvc(addFilters = false)
public class CartItemControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    CartItemService cartItemService;

    @MockitoBean
    CartService cartService;

    private CartDTO sampleCartDto() {
        // CartDTO(Long id, Integer userId, List<CartItemDTO> items, BigDecimal total, LocalDateTime holdExpiresAt)
        return new CartDTO(
                1L,
                123,
                List.<CartItemDTO>of(),
                BigDecimal.valueOf(200.00),
                null
        );
    }

    // ===== GET /api/cart =====
    @Test
    @DisplayName("GET /api/cart -> 200 con header X-User-Id válido")
    void getActiveCart_ok() throws Exception {
        given(cartService.getActiveCart(123)).willReturn(sampleCartDto());

        mvc.perform(get("/api/cart")
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.userId", is(123)));
    }

    // ===== POST /api/cart/items =====
    @Test
    @DisplayName("POST /api/cart/items -> 200 con request válido")
    void addItem_ok() throws Exception {
        var reqJson = """
                {
                  "eventId": 10,
                  "eventZoneId": 20,
                  "qty": 2
                }
                """;

        given(cartItemService.addItem(anyInt(), anyInt(), anyInt(), anyInt()))
                .willReturn(sampleCartDto());

        mvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson)
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.userId", is(123)));
    }

    @Test
    @DisplayName("POST /api/cart/items -> 400 cuando el service lanza excepción")
    void addItem_error() throws Exception {
        var reqJson = """
                {
                  "eventId": 999,
                  "eventZoneId": 20,
                  "qty": 1
                }
                """;

        given(cartItemService.addItem(anyInt(), anyInt(), anyInt(), anyInt()))
                .willThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event not found"));

        mvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson)
                        .header("X-User-Id", "123"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Event not found")));
    }

    // ===== PATCH /api/cart/items/{id} =====
    @Test
    @DisplayName("PATCH /api/cart/items/{id} -> 200 con request válido")
    void updateItem_ok() throws Exception {
        var reqJson = """
                {
                  "qty": 3
                }
                """;

        given(cartItemService.updateItem(anyInt(), anyLong(), anyInt()))
                .willReturn(sampleCartDto());

        mvc.perform(patch("/api/cart/items/{id}", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson)
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.userId", is(123)));
    }

    // ===== DELETE /api/cart/items/{id} =====
    @Test
    @DisplayName("DELETE /api/cart/items/{id} -> 200 con request válido")
    void removeItem_ok() throws Exception {
        given(cartItemService.removeItem(anyInt(), anyLong()))
                .willReturn(sampleCartDto());

        mvc.perform(delete("/api/cart/items/{id}", 99L)
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.userId", is(123)));
    }
}

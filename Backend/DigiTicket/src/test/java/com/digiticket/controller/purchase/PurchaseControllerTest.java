package com.digiticket.controller.purchase;

import com.digiticket.controller.history.PurchaseHistoryController;
import com.digiticket.dto.order.HistoryPurchaseDTO;
import com.digiticket.dto.order.PurchaseDTO;
import com.digiticket.service.order.PurchaseService;
import com.digiticket.exception.GlobalExceptionHandler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PurchaseControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PurchaseService purchaseService;

    @InjectMocks
    private PurchaseHistoryController purchaseController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(purchaseController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter()) // para serializar Page
                .build();
    }

    // ============================================================
    // TEST 1: Historial de compras paginado
    // ============================================================
    @Test
    void shouldReturnPaginatedPurchaseHistory() throws Exception {

        // Creamos un DTO de prueba
        HistoryPurchaseDTO dto = new HistoryPurchaseDTO(
                1,                          // purchaseId
                4,                          // totalQuantity
                200.0,                      // totalAmount
                "CARD",                     // paymentMethod
                "ACTIVE",                   // status
                LocalDateTime.now(),        // createdAt
                99,                         // eventId
                "Rock Festival",            // eventTitle
                LocalDateTime.now().plusDays(10) // eventStartsAt
        );

        Page<HistoryPurchaseDTO> page = new PageImpl<>(List.of(dto));

        // Mockeamos el servicio
        when(purchaseService.getPurchaseHistoryByClient(eq(5), eq(0), eq(10)))
                .thenReturn(page);

        // Ejecutamos la petición
        mockMvc.perform(get("/api/purchases/history")
                        .param("clientId", "5")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].purchaseId").value(1))
                .andExpect(jsonPath("$.content[0].totalQuantity").value(4))
                .andExpect(jsonPath("$.content[0].totalAmount").value(200.0))
                .andExpect(jsonPath("$.content[0].paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.content[0].eventId").value(99))
                .andExpect(jsonPath("$.content[0].eventTitle").value("Rock Festival"));

        // Verificamos que el servicio fue llamado correctamente
        verify(purchaseService, times(1))
                .getPurchaseHistoryByClient(eq(5), eq(0), eq(10));
    }

    // ============================================================
    // TEST 2: Obtener purchase por ID
    // ============================================================
    @Test
    void shouldReturnPurchaseById() throws Exception {

        PurchaseDTO purchase = new PurchaseDTO(
                1,                  // id
                42,                 // clientId
                99,                 // eventId
                4,                  // totalQuantity
                200.0,              // totalAmount
                "CARD",             // paymentMethod
                "ACTIVE",           // status
                LocalDateTime.now() // createdAt
        );

        when(purchaseService.getPurchaseById(1)).thenReturn(purchase);

        mockMvc.perform(get("/api/purchases/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.clientId").value(42))
                .andExpect(jsonPath("$.eventId").value(99))
                .andExpect(jsonPath("$.totalQuantity").value(4))
                .andExpect(jsonPath("$.totalAmount").value(200.0))
                .andExpect(jsonPath("$.paymentMethod").value("CARD"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(purchaseService, times(1)).getPurchaseById(eq(1));
    }
}

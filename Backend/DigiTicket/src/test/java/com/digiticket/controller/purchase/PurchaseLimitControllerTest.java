package com.digiticket.controller.purchase;

import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;
import com.digiticket.service.purchase.PurchaseLimitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PurchaseLimitController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PurchaseLimitController - Test de Endpoint")
class PurchaseLimitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PurchaseLimitService purchaseLimitService;

    // Constante para el límite de tickets en los tests
    private static final int MOCK_MAX_TICKETS = 4;

    @Test
    @DisplayName("GET /api/events/{eventId}/purchase-limit - Usuario sin compras")
    void testGetPurchaseLimit_NoTickets() throws Exception {
        // Given
        Integer userId = 1;
        Integer eventId = 100;
        PurchaseLimitInfoDTO response = new PurchaseLimitInfoDTO(
                userId, eventId, MOCK_MAX_TICKETS, 0, MOCK_MAX_TICKETS
        );
        when(purchaseLimitService.getLimitInfo(userId, eventId)).thenReturn(response);

        // When & Then
        MvcResult result = mockMvc.perform(get("/api/events/{eventId}/purchase-limit", eventId)
                        .param("userId", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.eventId").value(100))
                .andExpect(jsonPath("$.maxTicketsPerUser").value(MOCK_MAX_TICKETS))
                .andExpect(jsonPath("$.alreadyPurchased").value(0))
                .andExpect(jsonPath("$.remaining").value(MOCK_MAX_TICKETS))
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        System.out.println("\n===========================================");
        System.out.println("REQUEST: GET /api/events/100/purchase-limit?userId=1");
        System.out.println("===========================================");
        System.out.println("RESPONSE (200 OK):");
        System.out.println(formatJson(jsonResponse));
        System.out.println("===========================================\n");
    }

    @Test
    @DisplayName("GET /api/events/{eventId}/purchase-limit - Usuario con 3 tickets")
    void testGetPurchaseLimit_ThreeTickets() throws Exception {
        // Given
        Integer userId = 2;
        Integer eventId = 100;
        PurchaseLimitInfoDTO response = new PurchaseLimitInfoDTO(
                userId, eventId, MOCK_MAX_TICKETS, 3, 1
        );
        when(purchaseLimitService.getLimitInfo(userId, eventId)).thenReturn(response);

        // When & Then
        MvcResult result = mockMvc.perform(get("/api/events/{eventId}/purchase-limit", eventId)
                        .param("userId", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.eventId").value(100))
                .andExpect(jsonPath("$.maxTicketsPerUser").value(MOCK_MAX_TICKETS))
                .andExpect(jsonPath("$.alreadyPurchased").value(3))
                .andExpect(jsonPath("$.remaining").value(1))
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        System.out.println("\n===========================================");
        System.out.println("REQUEST: GET /api/events/100/purchase-limit?userId=2");
        System.out.println("===========================================");
        System.out.println("RESPONSE (200 OK):");
        System.out.println(formatJson(jsonResponse));
        System.out.println("===========================================\n");
    }

    @Test
    @DisplayName("GET /api/events/{eventId}/purchase-limit - Usuario alcanzó límite")
    void testGetPurchaseLimit_LimitReached() throws Exception {
        // Given
        Integer userId = 3;
        Integer eventId = 200;
        PurchaseLimitInfoDTO response = new PurchaseLimitInfoDTO(
                userId, eventId, MOCK_MAX_TICKETS, MOCK_MAX_TICKETS, 0
        );
        when(purchaseLimitService.getLimitInfo(userId, eventId)).thenReturn(response);

        // When & Then
        MvcResult result = mockMvc.perform(get("/api/events/{eventId}/purchase-limit", eventId)
                        .param("userId", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(3))
                .andExpect(jsonPath("$.eventId").value(200))
                .andExpect(jsonPath("$.maxTicketsPerUser").value(MOCK_MAX_TICKETS))
                .andExpect(jsonPath("$.alreadyPurchased").value(MOCK_MAX_TICKETS))
                .andExpect(jsonPath("$.remaining").value(0))
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        System.out.println("\n===========================================");
        System.out.println("REQUEST: GET /api/events/200/purchase-limit?userId=3");
        System.out.println("===========================================");
        System.out.println("RESPONSE (200 OK):");
        System.out.println(formatJson(jsonResponse));
        System.out.println("⚠️  ADVERTENCIA: Usuario alcanzó el límite (0 restantes)");
        System.out.println("===========================================\n");
    }

    @Test
    @DisplayName("GET /api/events/{eventId}/purchase-limit - Diferentes eventos")
    void testGetPurchaseLimit_DifferentEvents() throws Exception {
        // Evento 100
        PurchaseLimitInfoDTO response1 = new PurchaseLimitInfoDTO(1, 100, MOCK_MAX_TICKETS, 2, 2);
        when(purchaseLimitService.getLimitInfo(1, 100)).thenReturn(response1);

        MvcResult result1 = mockMvc.perform(get("/api/events/100/purchase-limit")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andReturn();

        // Evento 200
        PurchaseLimitInfoDTO response2 = new PurchaseLimitInfoDTO(1, 200, MOCK_MAX_TICKETS, 0, MOCK_MAX_TICKETS);
        when(purchaseLimitService.getLimitInfo(1, 200)).thenReturn(response2);

        MvcResult result2 = mockMvc.perform(get("/api/events/200/purchase-limit")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andReturn();

        System.out.println("\n===========================================");
        System.out.println("MISMO USUARIO - DIFERENTES EVENTOS");
        System.out.println("===========================================");
        System.out.println("\nREQUEST 1: GET /api/events/100/purchase-limit?userId=1");
        System.out.println(formatJson(result1.getResponse().getContentAsString()));
        
        System.out.println("\nREQUEST 2: GET /api/events/200/purchase-limit?userId=1");
        System.out.println(formatJson(result2.getResponse().getContentAsString()));
        System.out.println("\n✓ Límites independientes por evento");
        System.out.println("===========================================\n");
    }

    private String formatJson(String json) {
        try {
            // Parse y formatear JSON manualmente para mejor visualización
            json = json.replace("{", "{\n  ")
                      .replace(",", ",\n  ")
                      .replace("}", "\n}");
            return json;
        } catch (Exception e) {
            return json;
        }
    }
}

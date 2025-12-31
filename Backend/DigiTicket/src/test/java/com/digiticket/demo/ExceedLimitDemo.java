package com.digiticket.demo;

import com.digiticket.domain.user.Client;
import com.digiticket.exception.TicketLimitExceededException;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.impl.purchase.PurchaseLimitServiceImpl;
import com.digiticket.service.settings.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Demostración: ¿Qué ocurre cuando se intenta exceder el límite?")
class ExceedLimitDemo {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private SettingsService settingsService;

    private PurchaseLimitServiceImpl service;

    private static final int MOCK_MAX_TICKETS = 4;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Mock del límite de tickets
        when(settingsService.getMaxTicketsPerPurchase()).thenReturn(MOCK_MAX_TICKETS);
        
        // Crear servicio con todas las dependencias
        service = new PurchaseLimitServiceImpl(
                null, // orderItemRepo no se usa
                ticketRepository,
                clientRepository,
                settingsService
        );
    }

    @Test
    @DisplayName("Escenario 1: Usuario con 4 tickets intenta comprar 1 más")
    void scenario1_userWith4TicketsTries1More() {
        System.out.println("\n╔══════════════════════════════════════════════════════════╗");
        System.out.println("║         ESCENARIO 1: LÍMITE ALCANZADO                    ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");
        
        Integer userId = 1;
        Integer clientId = 10;
        Integer eventId = 100;
        
        // Mock del cliente
        Client mockClient = Client.builder().id(clientId).build();
        when(clientRepository.findByUserId(userId)).thenReturn(Optional.of(mockClient));
        
        // Usuario ya compró 4 tickets
        when(ticketRepository.countByOwnerAndEvent(clientId, eventId))
                .thenReturn(MOCK_MAX_TICKETS);
        
        System.out.println("\n📊 ESTADO ACTUAL:");
        System.out.println("   Usuario ID: " + userId);
        System.out.println("   Evento ID: " + eventId);
        System.out.println("   Tickets ya comprados (PAID): 4");
        System.out.println("   Tickets que intenta comprar: 1");
        System.out.println("   Límite máximo permitido: 4");
        
        System.out.println("\n🔍 INTENTANDO VALIDAR...");
        
        // Intentar validar
        TicketLimitExceededException exception = assertThrows(
            TicketLimitExceededException.class,
            () -> service.validateLimitOrThrow(userId, eventId, 1)
        );
        
        System.out.println("\n❌ RESULTADO: OPERACIÓN RECHAZADA");
        System.out.println("\n📤 RESPUESTA HTTP QUE RECIBE EL CLIENTE:");
        System.out.println("─────────────────────────────────────────────────────────");
        System.out.println("HTTP/1.1 400 Bad Request");
        System.out.println("Content-Type: application/json\n");
        System.out.println("{");
        System.out.println("  \"errorCode\": \"" + exception.getErrorCode() + "\",");
        System.out.println("  \"message\": \"" + exception.getMessage() + "\",");
        System.out.println("  \"details\": {");
        System.out.println("    \"eventId\": " + exception.getDetails().get("eventId") + ",");
        System.out.println("    \"maxTicketsPerUser\": " + exception.getDetails().get("maxTicketsPerUser") + ",");
        System.out.println("    \"alreadyPurchased\": " + exception.getDetails().get("alreadyPurchased") + ",");
        System.out.println("    \"requested\": " + exception.getDetails().get("requested"));
        System.out.println("  }");
        System.out.println("}");
        System.out.println("─────────────────────────────────────────────────────────");
        System.out.println("✅ Test completado - Exception capturada correctamente\n");
    }

    @Test
    @DisplayName("Escenario 2: Usuario con 3 tickets intenta comprar 2 más")
    void scenario2_userWith3TicketsTries2More() {
        System.out.println("\n╔══════════════════════════════════════════════════════════╗");
        System.out.println("║         ESCENARIO 2: EXCEDE POR 1 TICKET                 ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");
        
        Integer userId = 2;
        Integer clientId = 20;
        Integer eventId = 200;
        
        // Mock del cliente
        Client mockClient = Client.builder().id(clientId).build();
        when(clientRepository.findByUserId(userId)).thenReturn(Optional.of(mockClient));
        
        when(ticketRepository.countByOwnerAndEvent(clientId, eventId))
                .thenReturn(3);
        
        System.out.println("\n📊 ESTADO ACTUAL:");
        System.out.println("   Usuario ID: " + userId);
        System.out.println("   Evento ID: " + eventId);
        System.out.println("   Tickets ya comprados: 3");
        System.out.println("   Tickets que intenta comprar: 2");
        System.out.println("   Total que tendría: 3 + 2 = 5");
        System.out.println("   Límite máximo permitido: 4");
        System.out.println("   Exceso: 1 ticket");
        
        TicketLimitExceededException exception = assertThrows(
            TicketLimitExceededException.class,
            () -> service.validateLimitOrThrow(userId, eventId, 2)
        );
        
        System.out.println("\n❌ OPERACIÓN RECHAZADA");
        System.out.println("💬 Mensaje al usuario: \"" + exception.getMessage() + "\"");
        System.out.println("📋 Detalles técnicos: " + exception.getDetails());
        System.out.println("✅ Test completado\n");
    }

    @Test
    @DisplayName("Escenario 3: Usuario con 2 tickets puede comprar 2 más (PERMITIDO)")
    void scenario3_userWith2TicketsBuys2More_ALLOWED() {
        System.out.println("\n╔══════════════════════════════════════════════════════════╗");
        System.out.println("║         ESCENARIO 3: DENTRO DEL LÍMITE (OK)              ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");
        
        Integer userId = 3;
        Integer clientId = 30;
        Integer eventId = 300;
        
        // Mock del cliente
        Client mockClient = Client.builder().id(clientId).build();
        when(clientRepository.findByUserId(userId)).thenReturn(Optional.of(mockClient));
        
        when(ticketRepository.countByOwnerAndEvent(clientId, eventId))
                .thenReturn(2);
        
        System.out.println("\n📊 ESTADO ACTUAL:");
        System.out.println("   Usuario ID: " + userId);
        System.out.println("   Tickets ya comprados: 2");
        System.out.println("   Tickets que intenta comprar: 2");
        System.out.println("   Total: 2 + 2 = 4");
        System.out.println("   Límite: 4");
        
        System.out.println("\n🔍 VALIDANDO...");
        
        // Esta vez NO debe lanzar excepción
        assertDoesNotThrow(() -> service.validateLimitOrThrow(userId, eventId, 2));
        
        System.out.println("✅ OPERACIÓN PERMITIDA");
        System.out.println("📤 El carrito/orden se procesará normalmente");
        System.out.println("✅ Test completado\n");
    }
}

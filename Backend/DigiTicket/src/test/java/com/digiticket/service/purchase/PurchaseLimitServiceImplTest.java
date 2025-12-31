package com.digiticket.service.purchase;

import com.digiticket.domain.user.Client;
import com.digiticket.domain.user.User;
import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;
import com.digiticket.exception.TicketLimitExceededException;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.impl.purchase.PurchaseLimitServiceImpl;
import com.digiticket.service.settings.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@DisplayName("PurchaseLimitService - Pruebas de Límite de Compra")
class PurchaseLimitServiceImplTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private SettingsService settingsService;

    private PurchaseLimitServiceImpl service;

    private static final Integer TEST_USER_ID = 1;
    private static final Integer TEST_CLIENT_ID = 10;
    private static final Integer TEST_EVENT_ID = 100;
    private static final int MOCK_MAX_TICKETS = 4;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Mock del límite de tickets desde SettingsService
        when(settingsService.getMaxTicketsPerPurchase()).thenReturn(MOCK_MAX_TICKETS);
        
        // Mock del cliente
        Client mockClient = Client.builder()
                .id(TEST_CLIENT_ID)
                .user(User.builder().id(TEST_USER_ID).build())
                .build();
        when(clientRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(mockClient));
        
        // Crear instancia con todas las dependencias
        service = new PurchaseLimitServiceImpl(
                null, // orderItemRepo no se usa en la implementación actual
                ticketRepository,
                clientRepository,
                settingsService
        );
    }

    @Test
    @DisplayName("✓ Usuario sin compras previas debe tener límite completo (4 tickets)")
    void whenNoTicketsPurchased_shouldReturnFullLimit() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(0);

        // When
        PurchaseLimitInfoDTO result = service.getLimitInfo(TEST_USER_ID, TEST_EVENT_ID);

        // Then
        assertNotNull(result);
        assertEquals(TEST_USER_ID, result.userId());
        assertEquals(TEST_EVENT_ID, result.eventId());
        assertEquals(MOCK_MAX_TICKETS, result.maxTicketsPerUser(), "El límite máximo debe ser " + MOCK_MAX_TICKETS);
        assertEquals(0, result.alreadyPurchased(), "No debe tener tickets comprados");
        assertEquals(MOCK_MAX_TICKETS, result.remaining(), "Debe tener " + MOCK_MAX_TICKETS + " tickets disponibles");
        
        System.out.println("✓ PASS: Usuario sin compras tiene límite completo");
    }

    @Test
    @DisplayName("✓ Usuario con 3 tickets comprados debe tener 1 disponible")
    void whenSomeTicketsPurchased_shouldReturnRemainingLimit() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(3);

        // When
        PurchaseLimitInfoDTO result = service.getLimitInfo(TEST_USER_ID, TEST_EVENT_ID);

        // Then
        assertEquals(3, result.alreadyPurchased(), "Debe tener 3 tickets comprados");
        assertEquals(1, result.remaining(), "Debe tener 1 ticket disponible");
        
        System.out.println("✓ PASS: Usuario con 3 tickets tiene 1 disponible");
    }

    @Test
    @DisplayName("✓ Usuario que alcanzó el límite debe tener 0 disponibles")
    void whenLimitReached_shouldReturnZeroRemaining() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(MOCK_MAX_TICKETS);

        // When
        PurchaseLimitInfoDTO result = service.getLimitInfo(TEST_USER_ID, TEST_EVENT_ID);

        // Then
        assertEquals(MOCK_MAX_TICKETS, result.alreadyPurchased(), "Debe tener " + MOCK_MAX_TICKETS + " tickets comprados");
        assertEquals(0, result.remaining(), "No debe tener tickets disponibles");
        
        System.out.println("✓ PASS: Usuario que alcanzó límite tiene 0 disponibles");
    }

    @Test
    @DisplayName("✓ Validación OK cuando no excede el límite")
    void whenWithinLimit_shouldNotThrowException() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(2);

        // When & Then
        assertDoesNotThrow(() -> service.validateLimitOrThrow(TEST_USER_ID, TEST_EVENT_ID, 2),
                "No debe lanzar excepción cuando está dentro del límite");
        
        System.out.println("✓ PASS: Validación OK - 2 comprados + 2 solicitados = 4 (dentro del límite)");
    }

    @Test
    @DisplayName("✗ Debe lanzar excepción cuando excede el límite")
    void whenExceedingLimit_shouldThrowException() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(3);

        // When & Then
        TicketLimitExceededException exception = assertThrows(
                TicketLimitExceededException.class,
                () -> service.validateLimitOrThrow(TEST_USER_ID, TEST_EVENT_ID, 2),
                "Debe lanzar excepción cuando excede el límite"
        );

        assertEquals("TICKET_LIMIT_EXCEEDED", exception.getErrorCode());
        assertEquals("Solo puedes comprar " + MOCK_MAX_TICKETS + " entradas como máximo para este evento.", exception.getMessage());
        assertEquals(TEST_EVENT_ID, exception.getDetails().get("eventId"));
        assertEquals(MOCK_MAX_TICKETS, exception.getDetails().get("maxTicketsPerUser"));
        assertEquals(3, exception.getDetails().get("alreadyPurchased"));
        assertEquals(2, exception.getDetails().get("requested"));
        
        System.out.println("✓ PASS: Excepción lanzada correctamente - 3 comprados + 2 solicitados = 5 (excede límite)");
        System.out.println("  Error: " + exception.getMessage());
        System.out.println("  Detalles: " + exception.getDetails());
    }

    @Test
    @DisplayName("✓ Validación OK cuando solicita exactamente el límite disponible")
    void whenAtExactLimit_shouldNotThrowException() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(0);

        // When & Then
        assertDoesNotThrow(() -> service.validateLimitOrThrow(TEST_USER_ID, TEST_EVENT_ID, MOCK_MAX_TICKETS),
                "Debe permitir comprar exactamente " + MOCK_MAX_TICKETS + " tickets");
        
        System.out.println("✓ PASS: Validación OK - 0 comprados + 4 solicitados = 4 (límite exacto)");
    }

    @Test
    @DisplayName("✗ Debe rechazar incluso 1 ticket cuando ya alcanzó el límite")
    void whenAlreadyAtLimit_shouldRejectEvenOne() {
        // Given
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, TEST_EVENT_ID))
                .thenReturn(MOCK_MAX_TICKETS);

        // When & Then
        TicketLimitExceededException exception = assertThrows(
                TicketLimitExceededException.class,
                () -> service.validateLimitOrThrow(TEST_USER_ID, TEST_EVENT_ID, 1),
                "Debe rechazar cualquier compra adicional si ya alcanzó el límite"
        );

        assertEquals(MOCK_MAX_TICKETS, exception.getDetails().get("alreadyPurchased"));
        assertEquals(1, exception.getDetails().get("requested"));
        
        System.out.println("✓ PASS: Rechaza compra - 4 comprados + 1 solicitado = 5 (excede límite)");
    }

    @Test
    @DisplayName("✓ Diferentes usuarios deben tener límites independientes")
    void differentUsers_shouldHaveIndependentLimits() {
        // Given
        Integer user1Id = 1;
        Integer user2Id = 2;
        Integer client1Id = 10;
        Integer client2Id = 20;
        
        // Mock cliente 1
        Client mockClient1 = Client.builder().id(client1Id).build();
        when(clientRepository.findByUserId(user1Id)).thenReturn(Optional.of(mockClient1));
        
        // Mock cliente 2
        Client mockClient2 = Client.builder().id(client2Id).build();
        when(clientRepository.findByUserId(user2Id)).thenReturn(Optional.of(mockClient2));
        
        // Mock tickets
        when(ticketRepository.countByOwnerAndEvent(client1Id, TEST_EVENT_ID))
                .thenReturn(MOCK_MAX_TICKETS);
        when(ticketRepository.countByOwnerAndEvent(client2Id, TEST_EVENT_ID))
                .thenReturn(0);

        // When
        PurchaseLimitInfoDTO user1Info = service.getLimitInfo(user1Id, TEST_EVENT_ID);
        PurchaseLimitInfoDTO user2Info = service.getLimitInfo(user2Id, TEST_EVENT_ID);

        // Then
        assertEquals(0, user1Info.remaining(), "Usuario 1 debe tener 0 disponibles");
        assertEquals(MOCK_MAX_TICKETS, user2Info.remaining(), "Usuario 2 debe tener " + MOCK_MAX_TICKETS + " disponibles");
        
        System.out.println("✓ PASS: Límites independientes por usuario");
    }

    @Test
    @DisplayName("✓ Mismo usuario debe tener límites independientes por evento")
    void sameUser_shouldHaveIndependentLimitsPerEvent() {
        // Given
        Integer event1 = 100;
        Integer event2 = 200;
        
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, event1))
                .thenReturn(MOCK_MAX_TICKETS);
        when(ticketRepository.countByOwnerAndEvent(TEST_CLIENT_ID, event2))
                .thenReturn(0);

        // When
        PurchaseLimitInfoDTO event1Info = service.getLimitInfo(TEST_USER_ID, event1);
        PurchaseLimitInfoDTO event2Info = service.getLimitInfo(TEST_USER_ID, event2);

        // Then
        assertEquals(0, event1Info.remaining(), "Evento 1 debe tener 0 disponibles");
        assertEquals(MOCK_MAX_TICKETS, event2Info.remaining(), "Evento 2 debe tener " + MOCK_MAX_TICKETS + " disponibles");
        
        System.out.println("✓ PASS: Límites independientes por evento");
    }
}
//package com.digiticket.service.purchase;
//
//import com.digiticket.domain.order.OrderStatus;
//import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;
//import com.digiticket.exception.TicketLimitExceededException;
//import com.digiticket.repository.order.OrderItemRepository;
//import com.digiticket.service.impl.purchase.PurchaseLimitServiceImpl;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.MockitoAnnotations;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.when;
//
//@DisplayName("PurchaseLimitService - Pruebas de Límite de Compra")
//class PurchaseLimitServiceImplTest {
//
//    @Mock
//    private OrderItemRepository orderItemRepo;
//
//    @InjectMocks
//    private PurchaseLimitServiceImpl service;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//    }
//
//    @Test
//    @DisplayName("✓ Usuario sin compras previas debe tener límite completo (4 tickets)")
//    void whenNoTicketsPurchased_shouldReturnFullLimit() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(0);
//
//        // When
//        PurchaseLimitInfoDTO result = service.getLimitInfo(userId, eventId);
//
//        // Then
//        assertNotNull(result);
//        assertEquals(userId, result.userId());
//        assertEquals(eventId, result.eventId());
//        assertEquals(4, result.maxTicketsPerUser(), "El límite máximo debe ser 4");
//        assertEquals(0, result.alreadyPurchased(), "No debe tener tickets comprados");
//        assertEquals(4, result.remaining(), "Debe tener 4 tickets disponibles");
//
//        System.out.println("✓ PASS: Usuario sin compras tiene límite completo");
//    }
//
//    @Test
//    @DisplayName("✓ Usuario con 3 tickets comprados debe tener 1 disponible")
//    void whenSomeTicketsPurchased_shouldReturnRemainingLimit() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(3);
//
//        // When
//        PurchaseLimitInfoDTO result = service.getLimitInfo(userId, eventId);
//
//        // Then
//        assertEquals(3, result.alreadyPurchased(), "Debe tener 3 tickets comprados");
//        assertEquals(1, result.remaining(), "Debe tener 1 ticket disponible");
//
//        System.out.println("✓ PASS: Usuario con 3 tickets tiene 1 disponible");
//    }
//
//    @Test
//    @DisplayName("✓ Usuario que alcanzó el límite debe tener 0 disponibles")
//    void whenLimitReached_shouldReturnZeroRemaining() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(4);
//
//        // When
//        PurchaseLimitInfoDTO result = service.getLimitInfo(userId, eventId);
//
//        // Then
//        assertEquals(4, result.alreadyPurchased(), "Debe tener 4 tickets comprados");
//        assertEquals(0, result.remaining(), "No debe tener tickets disponibles");
//
//        System.out.println("✓ PASS: Usuario que alcanzó límite tiene 0 disponibles");
//    }
//
//    @Test
//    @DisplayName("✓ Validación OK cuando no excede el límite")
//    void whenWithinLimit_shouldNotThrowException() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(2);
//
//        // When & Then
//        assertDoesNotThrow(() -> service.validateLimitOrThrow(userId, eventId, 2),
//                "No debe lanzar excepción cuando está dentro del límite");
//
//        System.out.println("✓ PASS: Validación OK - 2 comprados + 2 solicitados = 4 (dentro del límite)");
//    }
//
//    @Test
//    @DisplayName("✗ Debe lanzar excepción cuando excede el límite")
//    void whenExceedingLimit_shouldThrowException() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(3);
//
//        // When & Then
//        TicketLimitExceededException exception = assertThrows(
//                TicketLimitExceededException.class,
//                () -> service.validateLimitOrThrow(userId, eventId, 2),
//                "Debe lanzar excepción cuando excede el límite"
//        );
//
//        assertEquals("TICKET_LIMIT_EXCEEDED", exception.getErrorCode());
//        assertEquals("Solo puedes comprar 4 entradas como máximo para este evento.", exception.getMessage());
//        assertEquals(100, exception.getDetails().get("eventId"));
//        assertEquals(4, exception.getDetails().get("maxTicketsPerUser"));
//        assertEquals(3, exception.getDetails().get("alreadyPurchased"));
//        assertEquals(2, exception.getDetails().get("requested"));
//
//        System.out.println("✓ PASS: Excepción lanzada correctamente - 3 comprados + 2 solicitados = 5 (excede límite)");
//        System.out.println("  Error: " + exception.getMessage());
//        System.out.println("  Detalles: " + exception.getDetails());
//    }
//
//    @Test
//    @DisplayName("✓ Validación OK cuando solicita exactamente el límite disponible")
//    void whenAtExactLimit_shouldNotThrowException() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(0);
//
//        // When & Then
//        assertDoesNotThrow(() -> service.validateLimitOrThrow(userId, eventId, 4),
//                "Debe permitir comprar exactamente 4 tickets");
//
//        System.out.println("✓ PASS: Validación OK - 0 comprados + 4 solicitados = 4 (límite exacto)");
//    }
//
//    @Test
//    @DisplayName("✗ Debe rechazar incluso 1 ticket cuando ya alcanzó el límite")
//    void whenAlreadyAtLimit_shouldRejectEvenOne() {
//        // Given
//        Integer userId = 1;
//        Integer eventId = 100;
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, eventId, OrderStatus.PAID))
//                .thenReturn(4);
//
//        // When & Then
//        TicketLimitExceededException exception = assertThrows(
//                TicketLimitExceededException.class,
//                () -> service.validateLimitOrThrow(userId, eventId, 1),
//                "Debe rechazar cualquier compra adicional si ya alcanzó el límite"
//        );
//
//        assertEquals(4, exception.getDetails().get("alreadyPurchased"));
//        assertEquals(1, exception.getDetails().get("requested"));
//
//        System.out.println("✓ PASS: Rechaza compra - 4 comprados + 1 solicitado = 5 (excede límite)");
//    }
//
//    @Test
//    @DisplayName("✓ Diferentes usuarios deben tener límites independientes")
//    void differentUsers_shouldHaveIndependentLimits() {
//        // Given
//        Integer user1 = 1;
//        Integer user2 = 2;
//        Integer eventId = 100;
//
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(user1, eventId, OrderStatus.PAID))
//                .thenReturn(4);
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(user2, eventId, OrderStatus.PAID))
//                .thenReturn(0);
//
//        // When
//        PurchaseLimitInfoDTO user1Info = service.getLimitInfo(user1, eventId);
//        PurchaseLimitInfoDTO user2Info = service.getLimitInfo(user2, eventId);
//
//        // Then
//        assertEquals(0, user1Info.remaining(), "Usuario 1 debe tener 0 disponibles");
//        assertEquals(4, user2Info.remaining(), "Usuario 2 debe tener 4 disponibles");
//
//        System.out.println("✓ PASS: Límites independientes por usuario");
//    }
//
//    @Test
//    @DisplayName("✓ Mismo usuario debe tener límites independientes por evento")
//    void sameUser_shouldHaveIndependentLimitsPerEvent() {
//        // Given
//        Integer userId = 1;
//        Integer event1 = 100;
//        Integer event2 = 200;
//
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, event1, OrderStatus.PAID))
//                .thenReturn(4);
//        when(orderItemRepo.sumTicketsByUserAndEventAndStatus(userId, event2, OrderStatus.PAID))
//                .thenReturn(0);
//
//        // When
//        PurchaseLimitInfoDTO event1Info = service.getLimitInfo(userId, event1);
//        PurchaseLimitInfoDTO event2Info = service.getLimitInfo(userId, event2);
//
//        // Then
//        assertEquals(0, event1Info.remaining(), "Evento 1 debe tener 0 disponibles");
//        assertEquals(4, event2Info.remaining(), "Evento 2 debe tener 4 disponibles");
//
//        System.out.println("✓ PASS: Límites independientes por evento");
//    }
//}

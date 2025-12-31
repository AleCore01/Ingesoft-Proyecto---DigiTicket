package com.digiticket.service.order;

import com.digiticket.domain.order.IdempotencyKey;
import com.digiticket.domain.order.Order;
import com.digiticket.domain.order.OrderItem;
import com.digiticket.domain.order.Payment;
import com.digiticket.domain.order.PaymentStatus;
import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.CartItemDTO;
import com.digiticket.dto.checkout.CheckoutRequest;
import com.digiticket.dto.order.OrderReceipt;
import com.digiticket.dto.order.PaymentResult;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.order.IdempotencyKeyRepository;
import com.digiticket.repository.order.OrderItemRepository;
import com.digiticket.repository.order.OrderRepository;
import com.digiticket.repository.order.PaymentRepository;
import com.digiticket.repository.order.PurchaseRepository;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.cart.CartService;
import com.digiticket.service.loyalty.LoyaltyService;
import com.digiticket.service.purchase.PurchaseLimitService;
import com.digiticket.service.reservation.ReservationService;
import com.digiticket.service.impl.order.OrderServiceImpl;
import com.digiticket.service.impl.order.PaymentSimulator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;



public class OrderServiceImplTest {
    @Mock private OrderRepository orderRepo;
    @Mock private OrderItemRepository orderItemRepo;
    @Mock private PaymentRepository paymentRepo;
    @Mock private PurchaseRepository purchaseRepository;
    @Mock private IdempotencyKeyRepository idemRepo;
    @Mock private TicketRepository ticketRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private EventRepository eventRepository;
    @Mock private EventZoneRepository eventZoneRepository;
    @Mock private CartService cartService;
    @Mock private ReservationService reservationService;
    @Mock private PaymentSimulator paymentSimulator;
    @Mock private LoyaltyService loyaltyService;
    @Mock private PurchaseLimitService purchaseLimitService;

    private OrderServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Crear el servicio manualmente con todas las 14 dependencias
        service = new OrderServiceImpl(
                orderRepo,
                orderItemRepo,
                paymentRepo,
                purchaseRepository,
                idemRepo,
                ticketRepository,
                clientRepository,
                eventRepository,
                eventZoneRepository,
                cartService,
                reservationService,
                paymentSimulator,
                loyaltyService,
                purchaseLimitService
        );
        
        // Mock del cliente para el usuario de los tests
        com.digiticket.domain.user.Client mockClient = new com.digiticket.domain.user.Client();
        mockClient.setId(1);
        when(clientRepository.findByUserId(10)).thenReturn(Optional.of(mockClient));
    }

    @Test
    void cheackout_successfulPayment_shouldCreateOrderAndConfirmHold(){
        Integer userId = 10;
        String idemKey ="ABC123XYZ";

        when(idemRepo.findByKeyAndUserId(idemKey,userId))
                .thenReturn(Optional.empty());

        // Mock del evento
        com.digiticket.domain.event.Event mockEvent = new com.digiticket.domain.event.Event();
        mockEvent.setId(100);
        mockEvent.setTitle("Test Event");
        when(eventRepository.findById(100)).thenReturn(Optional.of(mockEvent));

        // Mock del eventZone
        com.digiticket.domain.event.EventZone mockEventZone = new com.digiticket.domain.event.EventZone();
        mockEventZone.setId(20);
        mockEventZone.setPrice(new BigDecimal("50.00"));
        when(eventZoneRepository.findById(20)).thenReturn(Optional.of(mockEventZone));

        CartItemDTO item1 =new CartItemDTO(
                1L,100,20,2,
                new BigDecimal("50.00"),
                new BigDecimal("100.00")
        );
        CartDTO cart1 =new CartDTO(
          999L, userId,
          List.of(item1), new BigDecimal("100.00"),
          null
        );
        when(cartService.getActiveCart(userId)).thenReturn(cart1);

        when(reservationService.hasActiveHold(userId,999)).thenReturn(true);

        PaymentResult paymentResult = new PaymentResult(
                PaymentStatus.APPROVED,
                "AUTH123",
                "Pago OK"

        );
        when(paymentSimulator.authorize(
                new BigDecimal("100.00"),
                "tok_test",
                0,
                "CARD"
        )).thenReturn(paymentResult);

        CheckoutRequest checkoutRequest = new CheckoutRequest(
                "tok_test",
                0,
                "CARD"
        );

        OrderReceipt receipt = service.checkout(userId,checkoutRequest,idemKey);

        assertNotNull(receipt);
        assertEquals("PAID",receipt.paymentStatus());
        assertEquals(new BigDecimal("100.00"),receipt.totalPaid());

        verify(orderRepo).save(any(Order.class));
        verify(orderItemRepo).save(any(OrderItem.class));
        verify(paymentRepo).save(any(Payment.class));

        verify(reservationService).confirmHold(userId, 999);
        verify(cartService).clear(999);

        verify(idemRepo).save(any(IdempotencyKey.class));
        verify(paymentSimulator).authorize(new BigDecimal("100.00"), "tok_test", 0, "CARD");

    }
}

package com.digiticket.service.impl.order;

//import com.digiticket.domain.*;
import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.order.*;
import com.digiticket.domain.ticket.Ticket;
import com.digiticket.domain.ticket.TicketStatus;
import com.digiticket.domain.user.Client;
import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.CartItemDTO;
import com.digiticket.dto.checkout.CheckoutRequest;
import com.digiticket.dto.loyalty.PointsBalanceDTO;
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
import com.digiticket.service.order.OrderService;
import com.digiticket.service.purchase.PurchaseLimitService;
import com.digiticket.service.reservation.ReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final PaymentRepository paymentRepo;
    private final PurchaseRepository purchaseRepository;
    private final IdempotencyKeyRepository idemRepo;
    private final TicketRepository ticketRepository;
    private final ClientRepository clientRepository;
    private final EventRepository eventRepository;
    private final EventZoneRepository eventZoneRepository;

    private final CartService cartService;
    private final ReservationService reservationService;
    private final PaymentSimulator paymentSimulator;
    private final LoyaltyService loyaltyService;
    private final PurchaseLimitService purchaseLimitService;

    public OrderServiceImpl(OrderRepository orderRepo,
                            OrderItemRepository orderItemRepo,
                            PaymentRepository paymentRepo,
                            PurchaseRepository purchaseRepository,
                            IdempotencyKeyRepository idemRepo,
                            TicketRepository ticketRepository,
                            ClientRepository clientRepository,
                            EventRepository eventRepository,
                            EventZoneRepository eventZoneRepository,
                            CartService cartService,
                            ReservationService reservationService,
                            PaymentSimulator paymentSimulator,
                            LoyaltyService loyaltyService,
                            PurchaseLimitService purchaseLimitService) {
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.paymentRepo = paymentRepo;
        this.purchaseRepository = purchaseRepository;
        this.idemRepo = idemRepo;
        this.ticketRepository = ticketRepository;
        this.clientRepository = clientRepository;
        this.eventRepository = eventRepository;
        this.eventZoneRepository = eventZoneRepository;
        this.cartService = cartService;
        this.reservationService = reservationService;
        this.paymentSimulator = paymentSimulator;
        this.loyaltyService = loyaltyService;
        this.purchaseLimitService = purchaseLimitService;
    }

    @Override
    @Transactional
    public OrderReceipt checkout(Integer userId, CheckoutRequest req, String idemKey) {

        // ============================================================
        // IDEMPOTENCIA - si ya existe la key → devolver respuesta previa
        // ============================================================
        if (idemKey != null) {
            var existing = idemRepo.findByKeyAndUserId(idemKey, userId);
            if (existing.isPresent()) {
                Order savedOrder = existing.get().getOrder();
                return new OrderReceipt(
                        savedOrder.getId(),
                        savedOrder.getTotalPaid(),
                        savedOrder.getStatus().name(),
                        "IDEMPOTENT - OK"
                );
            }
        }

        // ============================================================
        // OBTENER CARRITO (DEV_2)
        // ============================================================
        CartDTO cart = cartService.getActiveCart(userId);
        if (cart.items().isEmpty()) {
            throw new IllegalStateException("El carrito está vacío.");
        }

        // ============================================================
        // VALIDAR LÍMITE DE COMPRA POR EVENTO (HU025 - DEV_3)
        // ============================================================
        // Agrupar items del carrito por evento y sumar cantidades
        Map<Integer, Integer> qtyPerEvent = cart.items().stream()
                .collect(Collectors.groupingBy(
                        CartItemDTO::eventId,
                        Collectors.summingInt(CartItemDTO::qty)
                ));

        // Validar el límite para cada evento
        for (Map.Entry<Integer, Integer> entry : qtyPerEvent.entrySet()) {
            Integer eventId = entry.getKey();
            Integer totalQty = entry.getValue();
            purchaseLimitService.validateLimitOrThrow(userId, eventId, totalQty);
        }

        // Total del carrito antes de descuentos
        BigDecimal total = cart.total();
        // Total a pagar, que puede variar por descuentos
        BigDecimal totalPaid = total;

        //=============================================================
        // APLICAR DESCUENTO POR PUNTOS
        //=============================================================

        int pointsToUse=req.pointsUsed();
        if(pointsToUse>0){
            //Obtener saldo real
            PointsBalanceDTO balance = loyaltyService.getBalance(userId);
            if(pointsToUse>balance.getRedeemablePoints()){
                throw new IllegalStateException("No hay suficientes puntos para este canje");
            }
            //Regla: 10 puntos =S/1
            BigDecimal discountAmount = new BigDecimal(pointsToUse)
                    .divide(new BigDecimal(10),2, RoundingMode.HALF_UP);

            if(discountAmount.compareTo(totalPaid)>0){
                throw new IllegalStateException(
                        "El descuento por puntos no puede superar el total del carrito"
                );
            }
            totalPaid=totalPaid.subtract(discountAmount);
        }


        // ============================================================
        // VALIDAR HOLD VIGENTE (DEV_3)
        // ============================================================
        System.out.println("🔍 [OrderService] Validando hold para userId=" + userId + " cartId=" + cart.id());
        boolean hashold=reservationService.hasActiveHold(userId,cart.id().intValue());
        System.out.println("🔍 [OrderService] hasActiveHold=" + hashold);

        if(!hashold) {
            throw new IllegalStateException("No existe una reserva activa. Debe tener una reserva antes de la compra");
        }

        // ============================================================
        // SIMULAR PAGO
        // ============================================================
        PaymentResult result = paymentSimulator.authorize(
                totalPaid,
                req.cardToken(),
                req.pointsUsed(),
                req.paymentMethod()
        );

        boolean approved = result.status() == PaymentStatus.APPROVED;

        // ============================================================
        // CREAR ORDER
        // ============================================================
        Order order = Order.builder()
            .userId(userId)
            .total(total)
            .totalPaid(totalPaid)
            .discountPointsUsed(req.pointsUsed())
            .status(approved ? OrderStatus.PAID : OrderStatus.FAILED)
            .createdAt(LocalDateTime.now())
            .build();

        orderRepo.save(order);

        // ============================================================
        // CREAR ORDER_ITEMS
        // ============================================================
        for (CartItemDTO item : cart.items()) {
            OrderItem oi = OrderItem.builder()
                    .order(order)
                    .eventId(item.eventId())
                    .ticketTypeId(item.eventZoneId()) // si tu ticketType == eventZone, se usa aquí
                    .qty(item.qty())
                    .unitPrice(item.unitPrice())
                    .build();
            orderItemRepo.save(oi);
        }

        // ============================================================
        // CREAR PAYMENT
        // ============================================================
        PaymentMethod method = resolvePaymentMethod(req.paymentMethod());

        Payment payment = Payment.builder()
            .order(order)
            .method(method)
                .authcode(result.authCode())
                .status(result.status())
                .message(result.message())
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepo.save(payment);

        // ============================================================
        // CONFIRMAR / LIBERAR HOLD (DEV_3)
        // ============================================================
        if (approved) {
            reservationService.confirmHold(userId, cart.id().intValue());
            createPurchasesAndTickets(userId, cart, method);
            if(pointsToUse>0){
                //descuento de puntos usados
                loyaltyService.redeemPoints(userId,pointsToUse);
            }
            //Suma de puntos ganados
            loyaltyService.addEarnedPoints(userId,totalPaid);
        } else {
            reservationService.releaseHold(userId, cart.id().intValue());
        }

        // ============================================================
        // LIMPIAR CARRITO (DEV_2)
        // ============================================================
        cartService.clear(cart.id().intValue());

        // ============================================================
        // GUARDAR IDEMPOTENCY_KEY si existe
        // ============================================================
        if (idemKey != null) {
            IdempotencyKey key = IdempotencyKey.builder()
                    .key(idemKey)
                    .userId(userId)
                    .requestHash(String.valueOf(req.hashCode()))
                    .order(order)
                    .createdAt(LocalDateTime.now())
                    .build();
            idemRepo.save(key);
        }
        // ============================================================
        // RETORNAR RECEIPT
        // ============================================================
        return new OrderReceipt(
                order.getId(),
                order.getTotalPaid(),
                order.getStatus().name(),
                result.message()
        );

    }

    private PaymentMethod resolvePaymentMethod(String rawMethod) {
        if (rawMethod == null) {
            return PaymentMethod.CARD_SIM;
        }
        return ("CARD".equalsIgnoreCase(rawMethod))
                ? PaymentMethod.CARD_SIM
                : PaymentMethod.WALLET_SIM;
    }

    private void createPurchasesAndTickets(Integer userId, CartDTO cart, PaymentMethod paymentMethod) {
        Client client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No existe un cliente asociado al usuario " + userId));

        Map<Integer, List<CartItemDTO>> itemsByEvent = cart.items().stream()
            .collect(Collectors.groupingBy(CartItemDTO::eventId));

        List<Ticket> ticketsToPersist = new ArrayList<>();

        // Convert PaymentMethod to PurchasePaymentMethod
        PurchasePaymentMethod purchaseMethod = (paymentMethod == PaymentMethod.CARD_SIM) 
                ? PurchasePaymentMethod.CARD 
                : PurchasePaymentMethod.POINTS;

        for (var entry : itemsByEvent.entrySet()) {
            Integer eventId = entry.getKey();
            List<CartItemDTO> eventItems = entry.getValue();

            Event event = eventRepository.findById(eventId)
                    .orElseThrow(() -> new IllegalStateException("Evento no encontrado con id " + eventId));

            int totalQty = eventItems.stream().mapToInt(CartItemDTO::qty).sum();
            BigDecimal totalAmount = eventItems.stream()
                    .map(CartItemDTO::subtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Purchase purchase = purchaseRepository.save(
                    Purchase.builder()
                            .client(client)
                            .event(event)
                            .totalQuantity(totalQty)
                            .totalAmount(totalAmount)
                            .paymentMethod(purchaseMethod)
                            .status(PurchaseStatus.ACTIVE)
                            .build()
            );

            for (CartItemDTO item : eventItems) {
                EventZone zone = eventZoneRepository.findById(item.eventZoneId())
                        .orElseThrow(() -> new IllegalStateException("Zona no encontrada con id " + item.eventZoneId()));

                for (int i = 0; i < item.qty(); i++) {
                    ticketsToPersist.add(
                            Ticket.builder()
                                    .purchase(purchase)
                                    .eventZoneId(zone.getId())
                                    .presale(false)
                                    .ticketUrl(null)
                                    .createdAt(LocalDateTime.now())
                                    .status(TicketStatus.ACTIVE)
                                    .ownerClientId(client.getId())
                                    .transferCount(0)
                                    .build()
                    );
                }
            }
        }

        if (!ticketsToPersist.isEmpty()) {
            ticketRepository.saveAll(ticketsToPersist);
        }
    }


}

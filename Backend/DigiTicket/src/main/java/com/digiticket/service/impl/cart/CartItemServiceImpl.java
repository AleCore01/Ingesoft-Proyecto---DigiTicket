package com.digiticket.service.impl.cart;

import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.CartItemDTO;
import com.digiticket.domain.cart.Cart;
import com.digiticket.domain.cart.CartItem;
import com.digiticket.domain.event.EventZone;
import com.digiticket.repository.cart.CartItemRepository;
import com.digiticket.repository.cart.CartRepository;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.service.cart.CartItemService;
import com.digiticket.repository.reservation.ReservationHoldRepository;
import com.digiticket.domain.reservation.ReservationHold;
import com.digiticket.service.purchase.PurchaseLimitService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional
public class CartItemServiceImpl implements CartItemService {

    private static final int MAX_PER_EVENT = 4;

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;
    private final EventZoneRepository eventZoneRepo;
    private final PurchaseLimitService purchaseLimitService;
    private final ReservationHoldRepository holdRepo;

    public CartItemServiceImpl(CartRepository cartRepo,
                               CartItemRepository itemRepo,
                               EventZoneRepository eventZoneRepo,
                               PurchaseLimitService purchaseLimitService,
                               ReservationHoldRepository holdRepo) {
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
        this.eventZoneRepo = eventZoneRepo;
        this.purchaseLimitService = purchaseLimitService;
        this.holdRepo = holdRepo;
    }

    @Override
    public CartDTO addItem(Integer userId, Integer eventId, Integer eventZoneId, Integer qty) {
        if (qty == null || qty <= 0) throw new IllegalArgumentException("qty must be > 0");

        Cart cart = cartRepo.findByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(userId);
            return cartRepo.save(c);
        });

        // Calcular cuántos tickets ya tiene en el carrito para este evento
        int currentForEvent = itemRepo.findByCart_IdAndEventId(cart.getId(), eventId)
                .stream()
                .mapToInt(CartItem::getQty)
                .sum();

        // Validar límite considerando histórico de compras + carrito
        purchaseLimitService.validateLimitOrThrow(userId, eventId, currentForEvent + qty);

        // Verificar que no exceda el máximo por carrito (redundante con el límite de compra, pero mantenemos la regla)
        if (currentForEvent + qty > MAX_PER_EVENT) {
            throw new IllegalArgumentException("Máximo permitido por evento: " + MAX_PER_EVENT);
        }

        EventZone ez = eventZoneRepo.findById(eventZoneId)
                .orElseThrow(() -> new EntityNotFoundException("EventZone no encontrada: " + eventZoneId));

        BigDecimal price = ez.getPrice();

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setEventId(eventId);
        item.setEventZoneId(eventZoneId);
        item.setQty(qty);
        item.setUnitPrice(price);
        item.updateSubtotal();

        cart.addItem(item);
        cartRepo.save(cart);

        return toDTO(cart);
    }

    @Override
    public CartDTO updateItem(Integer userId, Long cartItemId, Integer qty) {
        if (qty == null || qty <= 0) throw new IllegalArgumentException("qty must be > 0");

        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Cart no encontrado"));

        CartItem item = itemRepo.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Item no encontrado"));

        // Calcular cantidad de otros items del mismo evento
        int others = itemRepo.findByCart_IdAndEventId(cart.getId(), item.getEventId())
                .stream()
                .filter(ci -> !ci.getId().equals(item.getId()))
                .mapToInt(CartItem::getQty)
                .sum();

        // Validar límite considerando histórico de compras + carrito actualizado
        purchaseLimitService.validateLimitOrThrow(userId, item.getEventId(), others + qty);

        // Verificar que no exceda el máximo por carrito
        if (others + qty > MAX_PER_EVENT) {
            throw new IllegalArgumentException("Máximo permitido por evento: " + MAX_PER_EVENT);
        }

        item.setQty(qty);
        item.updateSubtotal();
        cartRepo.save(cart);

        return toDTO(cart);
    }

    @Override
    public CartDTO removeItem(Integer userId, Long cartItemId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Cart no encontrado"));

        CartItem item = itemRepo.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Item no encontrado"));

        // Expirar holds PENDING/WAITING asociados a este cart_item antes de eliminarlo
        var olds = holdRepo.findByUserAndCartItemIds(userId, java.util.List.of(cartItemId));
        if (!olds.isEmpty()) {
            var ids = olds.stream().map(ReservationHold::getId).toList();
            holdRepo.expireByIds(ids);
        }

        cart.removeItem(item);
        itemRepo.delete(item);

        return toDTO(cart);
    }

    // ====== mapping simple (sin mapper)
    private CartDTO toDTO(Cart cart) {
        var itemDTOs = cart.getItems().stream().map(this::toDTO).toList();
        var total = itemDTOs.stream().map(CartItemDTO::subtotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        // Buscar hold PENDING activo más reciente del usuario para este carrito
        java.time.LocalDateTime holdExpiresAt = null;
        if (!cart.getItems().isEmpty()) {
            var cartItemIds = cart.getItems().stream().map(com.digiticket.domain.cart.CartItem::getId).toList();
            var holds = holdRepo.findByUserAndCartItemIds(cart.getUserId(), cartItemIds);
            
            // Tomar el expiresAt más lejano de los holds PENDING vigentes
            holdExpiresAt = holds.stream()
                .filter(h -> h.getStatus() == com.digiticket.domain.reservation.ReservationStatus.PENDING)
                .filter(h -> h.getExpiresAt() != null && h.getExpiresAt().isAfter(java.time.LocalDateTime.now()))
                .map(h -> h.getExpiresAt())
                .max(java.time.LocalDateTime::compareTo)
                .orElse(null);
        }
        
        return new CartDTO(cart.getId(), cart.getUserId(), itemDTOs, total, holdExpiresAt);
    }

    private CartItemDTO toDTO(CartItem it) {
        return new CartItemDTO(
                it.getId(),
                it.getEventId(),
                it.getEventZoneId(),
                it.getQty(),
                it.getUnitPrice(),
                it.getSubtotal()
        );
    }
}

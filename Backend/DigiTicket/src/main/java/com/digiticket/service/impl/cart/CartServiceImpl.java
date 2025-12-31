package com.digiticket.service.impl.cart;

import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.CartItemDTO;
import com.digiticket.domain.cart.Cart;
import com.digiticket.domain.cart.CartItem;
import com.digiticket.repository.cart.CartRepository;
import com.digiticket.repository.reservation.ReservationHoldRepository;
import com.digiticket.service.cart.CartService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final ReservationHoldRepository holdRepo;

    public CartServiceImpl(CartRepository cartRepo, ReservationHoldRepository holdRepo) {
        this.cartRepo = cartRepo;
        this.holdRepo = holdRepo;
    }

    @Override
    public CartDTO getActiveCart(Integer userId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Cart no encontrado para usuario " + userId));
        return toDTO(cart);
    }

    @Override
    @Transactional
    public void clear(Integer cartId) {
        Cart cart=cartRepo.findById(cartId.longValue())
                .orElseThrow(()->new EntityNotFoundException("Cart no encontrado"));
        cart.getItems().clear();
        cartRepo.save(cart);

    }

    // ====== mapping simple (sin mapper)
    private CartDTO toDTO(Cart cart) {
        var itemDTOs = cart.getItems().stream().map(this::toDTO).toList();
        var total = itemDTOs.stream().map(CartItemDTO::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Buscar hold PENDING activo más reciente del usuario para este carrito
        LocalDateTime holdExpiresAt = null;
        if (!cart.getItems().isEmpty()) {
            var cartItemIds = cart.getItems().stream().map(CartItem::getId).toList();
            var holds = holdRepo.findByUserAndCartItemIds(cart.getUserId(), cartItemIds);
            
            // Tomar el expiresAt más lejano de los holds PENDING vigentes
            holdExpiresAt = holds.stream()
                .filter(h -> h.getStatus() == com.digiticket.domain.reservation.ReservationStatus.PENDING)
                .filter(h -> h.getExpiresAt() != null && h.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(h -> h.getExpiresAt())
                .max(LocalDateTime::compareTo)
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

package com.digiticket.service.cart;

import com.digiticket.domain.cart.Cart;
import com.digiticket.domain.event.EventZone;
import com.digiticket.dto.cart.CartDTO;
import com.digiticket.repository.cart.CartItemRepository;
import com.digiticket.repository.cart.CartRepository;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.reservation.ReservationHoldRepository;
import com.digiticket.service.impl.cart.CartItemServiceImpl;
import com.digiticket.service.purchase.PurchaseLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartItemServiceImplTest {

    @Mock CartRepository cartRepository;
    @Mock CartItemRepository cartItemRepository;
    @Mock EventZoneRepository eventZoneRepository;
    @Mock PurchaseLimitService purchaseLimitService;
    @Mock ReservationHoldRepository holdRepo;

    private CartItemServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new CartItemServiceImpl(
                cartRepository,
                cartItemRepository,
                eventZoneRepository,
                purchaseLimitService,
                holdRepo
        );
    }

    private Cart sampleCart(Integer userId) {
        Cart c = new Cart();
        c.setUserId(userId);
        return c;
    }

    private EventZone sampleZone() {
        EventZone z = new EventZone();
        z.setPrice(new BigDecimal("100.00"));
        z.setSeatsQuota(100);
        z.setSeatsSold(0);
        return z;
    }

    @Test
    void addItem_ok_crea_item_y_no_lanza_excepcion() throws Exception {
        Integer userId = 123;
        Integer eventId = 10;
        Integer eventZoneId = 20;
        Integer qty = 2;

        Cart cart = sampleCart(userId);
        // Usar reflexión para setear el ID privado
        var idField = Cart.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(cart, 1L);
        
        EventZone zone = sampleZone();
        zone.setId(eventZoneId);

        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart_IdAndEventId(cart.getId(), eventId))
                .thenReturn(java.util.List.of());
        when(eventZoneRepository.findById(eventZoneId)).thenReturn(Optional.of(zone));
        when(cartRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(purchaseLimitService).validateLimitOrThrow(anyInt(), anyInt(), anyInt());

        CartDTO result = service.addItem(userId, eventId, eventZoneId, qty);

        assertThat(result).isNotNull();

        verify(cartRepository).findByUserId(userId);
        verify(eventZoneRepository).findById(eventZoneId);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    void addItem_eventZone_no_encontrado_lanza_excepcion() throws Exception {
        Integer userId = 123;
        Integer eventId = 999;
        Integer eventZoneId = 20;
        Integer qty = 1;

        Cart cart = sampleCart(userId);
        // Usar reflexión para setear el ID privado
        var idField = Cart.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(cart, 1L);
        
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCart_IdAndEventId(cart.getId(), eventId))
                .thenReturn(java.util.List.of());
        when(eventZoneRepository.findById(eventZoneId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addItem(userId, eventId, eventZoneId, qty))
                .isInstanceOf(RuntimeException.class);

        verify(cartRepository, never()).save(any());
    }
}

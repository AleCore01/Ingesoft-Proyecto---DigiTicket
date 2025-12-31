package com.digiticket.repository.cart;

import com.digiticket.domain.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCart_IdAndEventId(Long cartId, Integer eventId); // <<<<<< Integer
    Optional<CartItem> findByIdAndCart_Id(Long id, Long cartId);
}

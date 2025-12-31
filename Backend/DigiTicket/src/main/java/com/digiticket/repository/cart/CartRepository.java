package com.digiticket.repository.cart;

import com.digiticket.domain.cart.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Integer userId); // <<<<<< Integer
}

package com.digiticket.controller.cart;

import com.digiticket.dto.cart.CartDTO;
import com.digiticket.service.cart.CartService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * Obtiene el carrito activo del usuario.
     * Header esperado: X-User-Id: <numero>
     */
    @GetMapping
    public ResponseEntity<CartDTO> getActiveCart(HttpServletRequest request) {
        Integer userId = requireUserId(request);
        return ResponseEntity.ok(cartService.getActiveCart(userId));
    }

    // ===== Helpers =====
    private Integer requireUserId(HttpServletRequest req) {
        String raw = req.getHeader("X-User-Id");
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Header X-User-Id es requerido para esta operación");
        }
        try {
            return Integer.valueOf(raw);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("X-User-Id debe ser numérico (int)");
        }
    }
}

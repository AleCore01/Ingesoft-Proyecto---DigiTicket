package com.digiticket.controller.cart;

import com.digiticket.dto.cart.AddItemRequest;
import com.digiticket.dto.cart.CartDTO;
import com.digiticket.dto.cart.UpdateItemRequest;
import com.digiticket.service.cart.CartItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart/items")
public class CartItemController {

    private final CartItemService cartItemService;

    public CartItemController(CartItemService cartItemService) {
        this.cartItemService = cartItemService;
    }

    /**
     * Agrega un ítem al carrito. Regla: máx 4 por evento.
     * Body: { "eventId": <int>, "eventZoneId": <int>, "qty": <int> }
     * Header: X-User-Id: <numero>
     */
    @PostMapping
    public ResponseEntity<CartDTO> addItem(@Valid @RequestBody AddItemRequest req,
                                           HttpServletRequest request) {
        Integer userId = requireUserId(request);
        CartDTO dto = cartItemService.addItem(userId, req.eventId(), req.eventZoneId(), req.qty());
        return ResponseEntity.ok(dto);
    }

    /**
     * Actualiza la cantidad de un ítem del carrito.
     * Body: { "qty": <int> }
     * Path: /{id} = id del cart_item
     * Header: X-User-Id: <numero>
     */
    @PatchMapping("/{id}")
    public ResponseEntity<CartDTO> updateItem(@PathVariable("id") Long cartItemId,
                                              @Valid @RequestBody UpdateItemRequest req,
                                              HttpServletRequest request) {
        Integer userId = requireUserId(request);
        CartDTO dto = cartItemService.updateItem(userId, cartItemId, req.qty());
        return ResponseEntity.ok(dto);
    }

    /**
     * Elimina un ítem del carrito.
     * Header: X-User-Id: <numero>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<CartDTO> removeItem(@PathVariable("id") Long cartItemId,
                                              HttpServletRequest request) {
        Integer userId = requireUserId(request);
        CartDTO dto = cartItemService.removeItem(userId, cartItemId);
        return ResponseEntity.ok(dto);
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

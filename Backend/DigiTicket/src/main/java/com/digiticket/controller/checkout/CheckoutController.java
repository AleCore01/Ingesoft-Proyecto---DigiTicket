package com.digiticket.controller.checkout;


import com.digiticket.dto.checkout.CheckoutPayload;
import com.digiticket.dto.checkout.CheckoutRequest;
import com.digiticket.dto.order.OrderReceipt;
import com.digiticket.service.order.OrderService;
import com.digiticket.service.reservation.ReservationService;
import com.digiticket.util.JwtUtil;
import com.digiticket.util.TokenGenerator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final OrderService orderService;



    public CheckoutController(OrderService orderService, JwtUtil jwtUtil,ReservationService reservationService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderReceipt> checkout(
            @RequestBody CheckoutPayload payload,
            @RequestHeader(value="Idempotency-Key",required=false) String idemKey){
        // seguridad: el frontend envía userId
        Integer userId=payload.userId();
        if(userId==null){
            return ResponseEntity.badRequest().build();
        }

        if(idemKey==null||idemKey.isBlank()){
            idemKey=TokenGenerator.generateAlphanumeric(16);
        }

        // Construye el CheckoutRequest que espera OrderService.
        // Ajusta si tu CheckoutRequest tiene otra firma.
        CheckoutRequest req = new CheckoutRequest(
                payload.cardToken(),
                payload.pointsUsed() == null ? 0 : payload.pointsUsed(),
                payload.paymentMethod()
        );

        OrderReceipt receipt = orderService.checkout(userId, req, idemKey);
        return ResponseEntity.ok(receipt);

    }


}

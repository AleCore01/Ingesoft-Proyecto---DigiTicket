package com.digiticket.controller.order;

import com.digiticket.domain.order.Order;
import com.digiticket.dto.order.OrderSummaryDTO;
import com.digiticket.repository.order.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderQueryController {

    private final OrderRepository orderRepository;

    public OrderQueryController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderSummaryDTO>> listByUser(@PathVariable Integer userId) {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getUserId() != null && o.getUserId().equals(userId))
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .toList();

        List<OrderSummaryDTO> dtos = orders.stream().map(o -> new OrderSummaryDTO(
                o.getId(),
                o.getUserId(),
                o.getTotal(),
                o.getTotalPaid(),
                o.getStatus() != null ? o.getStatus().name() : null,
                o.getItems() != null ? o.getItems().size() : 0,
                o.getCreatedAt()
        )).toList();

        return ResponseEntity.ok(dtos);
    }
}

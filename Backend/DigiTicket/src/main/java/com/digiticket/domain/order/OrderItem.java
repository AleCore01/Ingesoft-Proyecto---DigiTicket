package com.digiticket.domain.order;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name ="order_item")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="order_id")
    private Order order;

    @Column(name = "event_id")
    private Integer eventId;
    @Column(name = "ticket_type_id")
    private Integer ticketTypeId;
    private Integer qty;
    @Column(name="unit_price")
    private BigDecimal unitPrice;
    @Column(name="subtotal", insertable = false, updatable = false)
    private BigDecimal subtotal;


}

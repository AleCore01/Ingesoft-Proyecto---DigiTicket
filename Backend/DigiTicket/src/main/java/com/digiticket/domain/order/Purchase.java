package com.digiticket.domain.order;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.user.Client;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@ToString(exclude = {"client", "event", "tickets"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    // ---------- RELATION: CLIENT ----------
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "client_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_purchase_client"))
    private Client client;

    // ---------- RELATION: EVENT ----------
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "event_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_purchase_event"))
    private Event event;

    // ---------- FIELDS ----------
    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;


    // ---------- FIELDS ----------
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PurchasePaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,
            columnDefinition = "ENUM('PENDING','COMPLETED','CANCELED') DEFAULT 'PENDING'")
    private PurchaseStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

//    // ---------- RELATION: TICKETS ----------
//    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    @JsonIgnore
//    private List<Ticket> tickets = new ArrayList<>();
//
//    public void addTicket(Ticket t) {
//        tickets.add(t);
//        t.setPurchase(this);
//    }
//
//    public void removeTicket(Ticket t) {
//        tickets.remove(t);
//        t.setPurchase(null);
//    }
}

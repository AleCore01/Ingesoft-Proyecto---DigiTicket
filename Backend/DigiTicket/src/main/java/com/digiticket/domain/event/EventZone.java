package com.digiticket.domain.event;

import com.digiticket.domain.location.LocationZone;
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

@Entity
@Table(
    name = "event_zone",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_event_zone_event_location_zone",
            columnNames = {"event_id", "location_zone_id"}
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@ToString(exclude = {"event", "locationZone"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class EventZone {

    public enum Status { ACTIVE, INACTIVE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    // Relation with Event
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ez_event"))
    @JsonIgnore
    private Event event;

    // Relation with LocationZone
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_zone_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ez_location_zone"))
    @JsonIgnore
    private LocationZone locationZone;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "seats_quota", nullable = false)
    private Integer seatsQuota;

    @Column(name = "seats_sold", nullable = false)
    private Integer seatsSold;

    @Column(name = "seats_available", insertable = false, updatable = false)
    private Integer seatsAvailable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false,
            columnDefinition = "ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'")
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

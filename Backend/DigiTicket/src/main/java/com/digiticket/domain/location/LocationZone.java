package com.digiticket.domain.location;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name="location_zone",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_location_zone_name", columnNames = {"location_id", "name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "location")
@EqualsAndHashCode(exclude = "location")
public class LocationZone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id",nullable = false,updatable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="location_id",nullable = false,
            foreignKey = @ForeignKey(name="fk_lz_location"))
    @JsonBackReference
    private Location location;

    @Column(name="name",nullable = false,length = 80)
    private String name;

    @Column(name="capacity",nullable = false)
    private Integer capacity;

    @CreationTimestamp
    @Column(name="created_at",nullable = false,updatable = false)
    private LocalDateTime created_at;

    @UpdateTimestamp
    @Column(name="updated_at",nullable = false)
    private LocalDateTime updated_at;

    @Enumerated(EnumType.STRING)
    @Column(name = "status",nullable = false,
            columnDefinition = "ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'")
    @Builder.Default
    private LocationStatus status=LocationStatus.ACTIVE;
}

package com.digiticket.domain.location;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "location",
        uniqueConstraints ={
                @UniqueConstraint(name="uq_location_name_address",columnNames = {"name","address"})
        }
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = "zones")
@EqualsAndHashCode(exclude = "zones")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id",nullable = false,updatable = false)
    private Integer id;

    @Column(name="name",nullable = false,length = 120)
    private String name;

    @Column(name="contact_email",length = 254)
    private String contactEmail;

    @Column(name="address",nullable = false)
    private String address;

    @Column(name ="city",nullable = false,length = 80)
    private String city;

    @Column(name ="district",nullable = false,length = 80)
    private String district;

    @Column(name="capacity",nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status",nullable = false,
            columnDefinition = "ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'")
    @Builder.Default
    private LocationStatus status=LocationStatus.ACTIVE;

    @CreationTimestamp
    @Column(name="created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name="updated_at",nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "location",cascade = CascadeType.ALL,
            orphanRemoval = true,fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore  // No serializar en JSON - evita N+1
    private List<LocationZone> zones;
}

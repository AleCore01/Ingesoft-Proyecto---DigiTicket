package com.digiticket.domain.event;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.user.Administrator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@ToString(exclude = {"location", "eventCategory", "administrator", "zones"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @Column(nullable = false, length = 160)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "sales_start_at", nullable = false)
    private LocalDateTime salesStartAt;

    @Column(name = "duration_min", nullable = false)
    private Integer durationMin;

    //Relation with location
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "location_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_location"))
    private Location location;

    //Relation with eventCategory
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "event_category_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_category"))
    private EventCategory eventCategory;

    //Relation with that administrator, who creates the event
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "administrator_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_event_admin"))
    private Administrator administrator;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,
            columnDefinition = "ENUM('DRAFT','PUBLISHED','CANCELED','FINISHED') DEFAULT 'DRAFT'")
    private EventStatus status;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data", columnDefinition = "MEDIUMBLOB", nullable = true)
    private byte[] imageData;

    //Relation with the zones of the event
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<EventZone> zones = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addZone(EventZone z) { zones.add(z); z.setEvent(this); }
    public void removeZone(EventZone z) { zones.remove(z); z.setEvent(null); }
}

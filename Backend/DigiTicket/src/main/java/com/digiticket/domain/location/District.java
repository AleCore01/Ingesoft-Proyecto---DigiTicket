package com.digiticket.domain.location;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = "city")
@EqualsAndHashCode(exclude = "city")
@Table(name="district")
public class District {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Integer id;

    @Column(name="name", nullable=false, length=100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="city_id",nullable=false)
    private City city;
}

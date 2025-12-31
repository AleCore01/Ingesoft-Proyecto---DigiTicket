package com.digiticket.domain.loyalty;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name ="points_config")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @Builder
public class PointsConfig {
    @Id
    private Integer id;
    private Integer pointsPerUnit;
}

package com.digiticket.dto.user;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Builder
@Data
public class AdminClientDTO {
    private Integer id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer loyaltyPoints;
    private LocalDate pointsExpiryDate;
}

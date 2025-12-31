package com.digiticket.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    private Integer id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String documentType;
    private String documentNumber;
    private LocalDate birthDate;
    private String gender;
    
    // Loyalty info (injected from external API)
    private Integer loyaltyPoints;
    
    // Stats
    private Integer totalPurchases;
    private Double totalSpent;
    private LocalDateTime memberSince;
}

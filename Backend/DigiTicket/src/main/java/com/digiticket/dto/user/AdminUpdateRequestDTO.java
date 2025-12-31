package com.digiticket.dto.user;

import lombok.Data;

@Data
public class AdminUpdateRequestDTO {

    private String code;
    private String firstName;
    private String lastName;
    private String documentType;      // opcional
    private String documentNumber;
    private String email;
    private String status;            // ACTIVE / INACTIVE
    private String role;              // ADMIN / SUPER_ADMIN
}

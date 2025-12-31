package com.digiticket.dto.user;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminResponseDTO {

    private Integer id;           // id de administrators
    private Integer userId;       // id de users

    private String code;
    private String firstName;
    private String lastName;
    private String documentType;
    private String documentNumber;
    private String email;
    private String status;        // ACTIVE / INACTIVE

    private String role;          // ADMIN / SUPER_ADMIN
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

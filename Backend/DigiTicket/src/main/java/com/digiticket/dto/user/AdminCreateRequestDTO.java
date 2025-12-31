package com.digiticket.dto.user;

import lombok.Data;

@Data
public class AdminCreateRequestDTO {

    private String code;              // Código: ADMIN-003
    private String firstName;         // Nombres
    private String lastName;          // Apellidos
    private String documentType;      // DNI, CE, etc. (enum DocumentType)
    private String documentNumber;    // Número de documento
    private String email;             // Correo
    private String password;          // Contraseña
    private String confirmPassword;   // Confirmar contraseña
    private String status;            // ACTIVE / INACTIVE (UserStatus)
    private String role;              // ADMIN / SUPER_ADMIN (RoleAdmin)
}

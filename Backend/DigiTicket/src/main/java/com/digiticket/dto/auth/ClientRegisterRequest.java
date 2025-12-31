package com.digiticket.dto.auth;

import com.digiticket.domain.user.DocumentType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record ClientRegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotNull DocumentType documentType,
        @NotBlank String documentNumber,
        @Past LocalDate birthDate,
        String phoneNumber,
        Boolean termsAccepted
) {}



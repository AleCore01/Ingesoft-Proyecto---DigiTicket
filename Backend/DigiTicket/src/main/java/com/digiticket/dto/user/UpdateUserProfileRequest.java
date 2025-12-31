package com.digiticket.dto.user;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateUserProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String documentType;
    private String documentNumber;
    private LocalDate birthDate;
}

package com.digiticket.controller;

import com.digiticket.domain.user.User;
import com.digiticket.dto.auth.ClientRegisterRequest;
import com.digiticket.dto.auth.ClientRegisterResponse;
import com.digiticket.dto.auth.LoginRequest;
import com.digiticket.dto.auth.LoginResponse;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.auth.AuthService;
import com.digiticket.service.auth.PasswordResetService;
import com.digiticket.util.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.containsString;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(com.digiticket.exception.GlobalExceptionHandler.class)
@ActiveProfiles("test")
@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
//@Disabled("Temporalmente deshabilitado: falla el ApplicationContext por configuración de BD de test")
public class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AuthService authService;
    @MockitoBean
    PasswordResetService passwordResetService;
    @MockitoBean
    UserRepository userRepository;
    @MockitoBean
    EmailService emailService;


    @Test
    @DisplayName("POST /api/auth/login -> 200 OK cuando credenciales válidas")
    void login_ok() throws Exception {
        var reqJson = """
                {"email":"user@acme.com","password":"Secret123"}
                """;

        var mockedResp = new LoginResponse("jwt-token", 10, "CLIENT", "John Doe");
        given(authService.login(any(LoginRequest.class))).willReturn(mockedResp);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", is("jwt-token")))
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.role", is("CLIENT")))
                .andExpect(jsonPath("$.name", is("John Doe")));
    }

    @Test
    @DisplayName("POST /api/auth/login -> 400 Bad Request por validación (password vacío)")
    void login_validation_error() throws Exception {
        var reqJson = """
                {"email":"user@acme.com","password":""}
                """;

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register -> 201 Created cuando payload válido")
    void register_created() throws Exception {
        var reqJson = """
                {
                  "firstName": "Juan",
                  "lastName": "Pérez",
                  "email": "juan.perez@acme.com",
                  "password": "Secret123",
                  "documentType": "DNI",
                  "documentNumber": "12345678",
                  "birthDate": "1999-10-15",
                  "phoneNumber": "999888777",
                  "termsAccepted": true
                }
                """;

        var mockedResp = org.mockito.Mockito.mock(ClientRegisterResponse.class);
        given(authService.registerClient(any(ClientRegisterRequest.class))).willReturn(mockedResp);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/auth/register -> 400 Bad Request por validación (password corto, email mal, birthDate futuro)")
    void register_validation_error() throws Exception {
        var invalidJson = """
                {
                  "firstName": "Juan",
                  "lastName": "Pérez",
                  "email": "no-es-email",
                  "password": "1234567",
                  "documentType": "DNI",
                  "documentNumber": "12345678",
                  "birthDate": "2999-01-01",
                  "termsAccepted": false
                }
                """;

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/request-reset -> 200 OK cuando email existe, genera token y envía correo")
    void requestReset_ok() throws Exception {
        var reqJson = """
                {"email":"user@acme.com"}
                """;
        var user = new User();
        user.setEmail("user@acme.com");

        given(userRepository.findByEmail("user@acme.com")).willReturn(Optional.of(user));
        given(passwordResetService.createPasswordResetToken(user)).willReturn("ABC123");

        mvc.perform(post("/api/auth/request-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Se ha enviado el token")));

        verify(emailService).sendResetPasswordEmail("user@acme.com", "ABC123");
    }

    @Test
    @DisplayName("POST /api/auth/request-reset -> 400 Bad Request cuando correo no registrado")
    void requestReset_notFound() throws Exception {
        var reqJson = """
                {"email":"missing@acme.com"}
                """;
        given(userRepository.findByEmail("missing@acme.com")).willReturn(Optional.empty());

        mvc.perform(post("/api/auth/request-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("El correo no está registrado")));
    }

    @Test
    @DisplayName("POST /api/auth/request-reset -> 400 Bad Request por validación (email vacío)")
    void requestReset_validation_error() throws Exception {
        var reqJson = """
                {"email":""}
                """;
        mvc.perform(post("/api/auth/request-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/verify-reset-code -> 200 OK con resetToken cuando email existe y código válido")
    void verifyResetCode_ok() throws Exception {
        var reqJson = """
                {"email":"user@acme.com","code":"ABC123"}
                """;
        var user = new User();
        user.setEmail("user@acme.com");

        given(userRepository.findByEmail("user@acme.com")).willReturn(Optional.of(user));
        given(passwordResetService.isValidToken("ABC123")).willReturn(true);

        mvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", is("ABC123")));
    }

    @Test
    @DisplayName("POST /api/auth/verify-reset-code -> 400 cuando correo no existe")
    void verifyResetCode_email_not_found() throws Exception {
        var reqJson = """
                {"email":"missing@acme.com","code":"ABC123"}
                """;
        given(userRepository.findByEmail("missing@acme.com")).willReturn(Optional.empty());

        mvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Correo no encontrado")));
    }

    @Test
    @DisplayName("POST /api/auth/verify-reset-code -> 400 cuando código inválido o expirado")
    void verifyResetCode_invalid_code() throws Exception {
        var reqJson = """
                {"email":"user@acme.com","code":"BAD999"}
                """;
        var user = new User();
        user.setEmail("user@acme.com");

        given(userRepository.findByEmail("user@acme.com")).willReturn(Optional.of(user));
        given(passwordResetService.isValidToken("BAD999")).willReturn(false);

        mvc.perform(post("/api/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Código inválido o expirado")));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password -> 200 OK cuando token válido")
    void resetPassword_ok() throws Exception {
        var reqJson = """
                {"token":"ABC123","password":"NewSecret123"}
                """;
        given(passwordResetService.resetPassword("ABC123", "NewSecret123")).willReturn(true);

        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Contraseña actualizada correctamente")));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password -> 400 cuando token inválido o expirado")
    void resetPassword_invalid() throws Exception {
        var reqJson = """
                {"token":"BAD999","password":"NewSecret123"}
                """;
        given(passwordResetService.resetPassword("BAD999", "NewSecret123")).willReturn(false);

        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Token inválido o expirado")));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password -> 400 por validación (password vacío)")
    void resetPassword_validation_error() throws Exception {
        var reqJson = """
                {"token":"ABC123","password":""}
                """;
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest());
    }
}

package com.digiticket.controller;

import com.digiticket.domain.user.User;
import com.digiticket.dto.auth.*;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.auth.AuthService;
import com.digiticket.service.auth.PasswordResetService;
import com.digiticket.util.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// 1. Importa Map y HashMap
import java.util.HashMap;
import java.util.Map;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AuthController(AuthService authService,
                          PasswordResetService passwordResetService,
                          UserRepository userRepository,
                          EmailService emailService
    ) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    public  ResponseEntity<ClientRegisterResponse>  registerClient(@Valid @RequestBody ClientRegisterRequest req) {
        return  ResponseEntity.status(HttpStatus.CREATED).body(authService.registerClient(req));
    }

    @PostMapping("/request-reset")
    public ResponseEntity<String> requestReset(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.email());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El correo no está registrado.");
        }

        User user = optionalUser.get();
        String token = passwordResetService.createPasswordResetToken(user);
        emailService.sendResetPasswordEmail(user.getEmail(), token);

        return ResponseEntity.ok("Se ha enviado el token al correo registrado.");
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerifyCodeRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.email());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Correo no encontrado."); // Los errores pueden seguir siendo texto
        }

        boolean valid = passwordResetService.isValidToken(request.code());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido o expirado."); // Los errores pueden seguir siendo texto
        }
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("resetToken", request.code());

        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = passwordResetService.resetPassword(request.token(), request.password());
        if (!success) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Token inválido o expirado.");
        }
        return ResponseEntity.ok("Contraseña actualizada correctamente.");
    }
}
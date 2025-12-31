package com.digiticket.service.impl.auth;

import com.digiticket.domain.user.Client;
import com.digiticket.domain.user.RoleUser;
import com.digiticket.domain.user.User;
import com.digiticket.domain.user.UserStatus;
import com.digiticket.dto.auth.ClientRegisterRequest;
import com.digiticket.dto.auth.ClientRegisterResponse;
import com.digiticket.dto.auth.LoginRequest;
import com.digiticket.dto.auth.LoginResponse;
import com.digiticket.security.JwtProvider;
import com.digiticket.service.auditlog.AuditLogService;
import com.digiticket.service.auth.AuthService;
import com.digiticket.service.user.ClientService;
import com.digiticket.service.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final ClientService clientService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuditLogService auditService;   // <-- Inyección del servicio de auditoría

    public AuthServiceImpl(UserService userService,
                           ClientService clientService,
                           PasswordEncoder passwordEncoder,
                           JwtProvider jwtProvider,
                           AuditLogService auditService) {       // <-- Recibir AuditService
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.clientService = clientService;
        this.auditService = auditService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userService.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }

        String token = jwtProvider.generateToken(
                user.getId(),
                user.getRoleUser().name()
        );

        // ====== AUDITORÍA ======
        auditService.log(
                user.getId(),
                "LOGIN",
                "El usuario inició sesión exitosamente"
        );

        return new LoginResponse(
                token,
                user.getId(),
                user.getRoleUser().name(),
                user.getFirstName()
        );
    }

    @Override
    public ClientRegisterResponse registerClient(ClientRegisterRequest request) {
        final String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userService.emailExists(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "El correo ya está registrado");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDocumentType(request.documentType());
        user.setDocumentNumber(request.documentNumber());
        user.setRoleUser(RoleUser.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setTermsAcceptedAt(LocalDateTime.now());
        user.setTermsAccepted(request.termsAccepted());

        user = userService.save(user);

        Client client = new Client();
        client.setUser(user);
        client.setBirthDate(request.birthDate());
        client.setPhoneNumber(request.phoneNumber());

        clientService.save(client);

        String token = jwtProvider.generateToken(
                user.getId(),
                user.getRoleUser().name()
        );

        // ====== AUDITORÍA ======
        auditService.log(
                user.getId(),
                "REGISTER",
                "Nuevo cliente registrado en el sistema"
        );

        return new ClientRegisterResponse(
                token,
                user.getId(),
                user.getFirstName(),
                user.getRoleUser().name()
        );
    }
}

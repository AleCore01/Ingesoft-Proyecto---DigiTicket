package com.digiticket.service;

import com.digiticket.domain.user.PasswordResetToken;
import com.digiticket.domain.user.User;
import com.digiticket.repository.user.PasswordResetTokenRepository;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.impl.auth.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
public class PasswordResetServiceImplTest {

    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock com.digiticket.service.settings.SettingsService settingsService;

    private PasswordResetServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Mock del TTL de tokens (15 minutos por defecto) - lenient para tests que no lo usan
        lenient().when(settingsService.getPasswordResetTokenTtlMinutes()).thenReturn(15);
        
        // Crear el servicio manualmente con todas las dependencias
        service = new PasswordResetServiceImpl(
                tokenRepository,
                userRepository,
                passwordEncoder,
                settingsService
        );
        
        user = new User();
        user.setEmail("user@acme.com");
    }

    @Test
    void createPasswordResetToken() {
        when(tokenRepository.findByUser(user)).thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);

        String token = service.createPasswordResetToken(user);

        assertNotNull(token);
        assertEquals(6, token.length());
        assertTrue(Pattern.matches("^[A-Za-z0-9]{6}$", token));

        verify(tokenRepository).save(captor.capture());
        PasswordResetToken saved = captor.getValue();

        assertSame(user, saved.getUser());
        assertEquals(token, saved.getToken());
        assertFalse(saved.isUsed());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime min = now.plusMinutes(14);
        LocalDateTime max = now.plusMinutes(16);
        assertTrue(saved.getExpirationDate().isAfter(min) && saved.getExpirationDate().isBefore(max),
                "expirationDate debe ser ~ now+15min");
    }

    @Test
    void new_createPasswordResetToken() {
        PasswordResetToken existente = PasswordResetToken.builder()
                .user(user)
                .token("OLD111")
                .expirationDate(LocalDateTime.now().minusMinutes(1))
                .used(true)
                .build();

        when(tokenRepository.findByUser(user)).thenReturn(Optional.of(existente));
        when(tokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        String nuevo = service.createPasswordResetToken(user);

        assertNotEquals("OLD111", nuevo);
        assertEquals(6, nuevo.length());
        assertFalse(existente.isUsed());
        assertEquals(nuevo, existente.getToken());
        assertTrue(existente.getExpirationDate().isAfter(LocalDateTime.now()));
        verify(tokenRepository).save(existente);
    }

    @Test
    void isValidToken_true() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("ABC123")
                .used(false)
                .expirationDate(LocalDateTime.now().plusMinutes(5))
                .build();
        when(tokenRepository.findByToken("ABC123")).thenReturn(Optional.of(t));

        assertTrue(service.isValidToken("ABC123"));
    }

    @Test
    void isValidToken_false_notExist() {
        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());
        assertFalse(service.isValidToken("NOPE"));
    }

    @Test
    void isValidToken_false_notUsed() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("USED77")
                .used(true)
                .expirationDate(LocalDateTime.now().plusMinutes(10))
                .build();
        when(tokenRepository.findByToken("USED77")).thenReturn(Optional.of(t));

        assertFalse(service.isValidToken("USED77"));
    }

    @Test
    void isValidToken_false_expired() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("EXP999")
                .used(false)
                .expirationDate(LocalDateTime.now().minusMinutes(1))
                .build();
        when(tokenRepository.findByToken("EXP999")).thenReturn(Optional.of(t));

        boolean result = service.isValidToken("EXP999");
        
        assertFalse(result);
        verify(tokenRepository).findByToken("EXP999");
    }

    @Test
    void resetPassword_true() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("ABC123")
                .used(false)
                .expirationDate(LocalDateTime.now().plusMinutes(5))
                .build();

        when(tokenRepository.findByToken("ABC123")).thenReturn(Optional.of(t));
        when(passwordEncoder.encode("NewSecret123")).thenReturn("ENCODED");

        boolean ok = service.resetPassword("ABC123", "NewSecret123");

        assertTrue(ok);
        assertEquals("ENCODED", user.getPassword());
        assertTrue(t.isUsed());
        verify(userRepository).save(user);
        verify(tokenRepository).save(t);
    }

    @Test
    void resetPassword_false_notExist() {
        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());

        boolean ok = service.resetPassword("NOPE", "NewSecret123");

        assertFalse(ok);
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void resetPassword_false_used() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("USED77")
                .used(true)
                .expirationDate(LocalDateTime.now().plusMinutes(5))
                .build();

        when(tokenRepository.findByToken("USED77")).thenReturn(Optional.of(t));

        boolean ok = service.resetPassword("USED77", "NewSecret123");

        assertFalse(ok);
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void resetPassword_false_expired() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("EXP999")
                .used(false)
                .expirationDate(LocalDateTime.now().minusMinutes(1))
                .build();

        when(tokenRepository.findByToken("EXP999")).thenReturn(Optional.of(t));

        boolean ok = service.resetPassword("EXP999", "NewSecret123");

        assertFalse(ok);
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void markTokenAsUsed() {
        PasswordResetToken t = PasswordResetToken.builder()
                .user(user)
                .token("MARK11")
                .used(false)
                .expirationDate(LocalDateTime.now().plusMinutes(5))
                .build();
        when(tokenRepository.findByToken("MARK11")).thenReturn(Optional.of(t));
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));

        service.markTokenAsUsed("MARK11");

        assertTrue(t.isUsed());
        verify(tokenRepository).save(t);
    }

    @Test
    void markTokenAsUsed_NOPE() {
        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());

        service.markTokenAsUsed("NOPE");

        verify(tokenRepository, never()).save(any());
    }
}
//package com.digiticket.service;
//
//import com.digiticket.domain.user.PasswordResetToken;
//import com.digiticket.domain.user.User;
//import com.digiticket.repository.user.PasswordResetTokenRepository;
//import com.digiticket.repository.user.UserRepository;
//import com.digiticket.service.impl.auth.PasswordResetServiceImpl;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.*;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.time.LocalDateTime;
//import java.util.Optional;
//import java.util.regex.Pattern;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//public class PasswordResetServiceImplTest {
//
//    @Mock PasswordResetTokenRepository tokenRepository;
//    @Mock UserRepository userRepository;
//    @Mock PasswordEncoder passwordEncoder;
//
//    @InjectMocks PasswordResetServiceImpl service;
//
//    private User user;
//
//    @BeforeEach
//    void setUp() {
//        user = new User();
//        user.setEmail("user@acme.com");
//    }
//
//    @Test
//    void createPasswordResetToken() {
//        when(tokenRepository.findByUser(user)).thenReturn(Optional.empty());
//        when(tokenRepository.save(any(PasswordResetToken.class)))
//                .thenAnswer(inv -> inv.getArgument(0));
//
//        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
//
//        String token = service.createPasswordResetToken(user);
//
//        assertNotNull(token);
//        assertEquals(6, token.length());
//        assertTrue(Pattern.matches("^[A-Za-z0-9]{6}$", token));
//
//        verify(tokenRepository).save(captor.capture());
//        PasswordResetToken saved = captor.getValue();
//
//        assertSame(user, saved.getUser());
//        assertEquals(token, saved.getToken());
//        assertFalse(saved.isUsed());
//
//        LocalDateTime now = LocalDateTime.now();
//        LocalDateTime min = now.plusMinutes(14);
//        LocalDateTime max = now.plusMinutes(16);
//        assertTrue(saved.getExpirationDate().isAfter(min) && saved.getExpirationDate().isBefore(max),
//                "expirationDate debe ser ~ now+15min");
//    }
//
//    @Test
//    void new_createPasswordResetToken() {
//        PasswordResetToken existente = PasswordResetToken.builder()
//                .user(user)
//                .token("OLD111")
//                .expirationDate(LocalDateTime.now().minusMinutes(1))
//                .used(true)
//                .build();
//
//        when(tokenRepository.findByUser(user)).thenReturn(Optional.of(existente));
//        when(tokenRepository.save(any(PasswordResetToken.class)))
//                .thenAnswer(inv -> inv.getArgument(0));
//
//        String nuevo = service.createPasswordResetToken(user);
//
//        assertNotEquals("OLD111", nuevo);
//        assertEquals(6, nuevo.length());
//        assertFalse(existente.isUsed());
//        assertEquals(nuevo, existente.getToken());
//        assertTrue(existente.getExpirationDate().isAfter(LocalDateTime.now()));
//        verify(tokenRepository).save(existente);
//    }
//
//    @Test
//    void isValidToken_true() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("ABC123")
//                .used(false)
//                .expirationDate(LocalDateTime.now().plusMinutes(5))
//                .build();
//        when(tokenRepository.findByToken("ABC123")).thenReturn(Optional.of(t));
//
//        assertTrue(service.isValidToken("ABC123"));
//    }
//
//    @Test
//    void isValidToken_false_notExist() {
//        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());
//        assertFalse(service.isValidToken("NOPE"));
//    }
//
//    @Test
//    void isValidToken_false_notUsed() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("USED77")
//                .used(true)
//                .expirationDate(LocalDateTime.now().plusMinutes(10))
//                .build();
//        when(tokenRepository.findByToken("USED77")).thenReturn(Optional.of(t));
//
//        assertFalse(service.isValidToken("USED77"));
//    }
//
//    @Test
//    void isValidToken_false_expired() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("EXP999")
//                .used(false)
//                .expirationDate(LocalDateTime.now().minusMinutes(1))
//                .build();
//        when(tokenRepository.findByToken("EXP999")).thenReturn(Optional.of(t));
//
//        assertFalse(service.isValidToken("EXP999"));
//    }
//
//    @Test
//    void resetPassword_true() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("ABC123")
//                .used(false)
//                .expirationDate(LocalDateTime.now().plusMinutes(5))
//                .build();
//
//        when(tokenRepository.findByToken("ABC123")).thenReturn(Optional.of(t));
//        when(passwordEncoder.encode("NewSecret123")).thenReturn("ENCODED");
//
//        boolean ok = service.resetPassword("ABC123", "NewSecret123");
//
//        assertTrue(ok);
//        assertEquals("ENCODED", user.getPassword());
//        assertTrue(t.isUsed());
//        verify(userRepository).save(user);
//        verify(tokenRepository).save(t);
//    }
//
//    @Test
//    void resetPassword_false_notExist() {
//        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());
//
//        boolean ok = service.resetPassword("NOPE", "NewSecret123");
//
//        assertFalse(ok);
//        verify(userRepository, never()).save(any());
//        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
//    }
//
//    @Test
//    void resetPassword_false_used() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("USED77")
//                .used(true)
//                .expirationDate(LocalDateTime.now().plusMinutes(5))
//                .build();
//
//        when(tokenRepository.findByToken("USED77")).thenReturn(Optional.of(t));
//
//        boolean ok = service.resetPassword("USED77", "NewSecret123");
//
//        assertFalse(ok);
//        verify(userRepository, never()).save(any());
//        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
//    }
//
//    @Test
//    void resetPassword_false_expired() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("EXP999")
//                .used(false)
//                .expirationDate(LocalDateTime.now().minusMinutes(1))
//                .build();
//
//        when(tokenRepository.findByToken("EXP999")).thenReturn(Optional.of(t));
//
//        boolean ok = service.resetPassword("EXP999", "NewSecret123");
//
//        assertFalse(ok);
//        verify(userRepository, never()).save(any());
//        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
//    }
//
//    @Test
//    void markTokenAsUsed() {
//        PasswordResetToken t = PasswordResetToken.builder()
//                .user(user)
//                .token("MARK11")
//                .used(false)
//                .expirationDate(LocalDateTime.now().plusMinutes(5))
//                .build();
//        when(tokenRepository.findByToken("MARK11")).thenReturn(Optional.of(t));
//        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
//
//        service.markTokenAsUsed("MARK11");
//
//        assertTrue(t.isUsed());
//        verify(tokenRepository).save(t);
//    }
//
//    @Test
//    void markTokenAsUsed_NOPE() {
//        when(tokenRepository.findByToken("NOPE")).thenReturn(Optional.empty());
//
//        service.markTokenAsUsed("NOPE");
//
//        verify(tokenRepository, never()).save(any());
//    }
//}

package com.digiticket.service.impl.auth;

import com.digiticket.domain.user.PasswordResetToken;
import com.digiticket.domain.user.User;
import com.digiticket.repository.user.PasswordResetTokenRepository;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.auth.PasswordResetService;
import com.digiticket.service.settings.SettingsService;
import com.digiticket.util.TokenGenerator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {
    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SettingsService settingsService;

    @Autowired
    public PasswordResetServiceImpl(PasswordResetTokenRepository tokenRepository,
                                    UserRepository userRepository,
                                    PasswordEncoder passwordEncoder,
                                    SettingsService settingsService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.settingsService = settingsService;
    }

    @Override
    public String createPasswordResetToken(User user) {
        PasswordResetToken token = tokenRepository.findByUser(user)
                .orElse(PasswordResetToken.builder().user(user).build());

        token.setToken(TokenGenerator.generateAlphanumeric(6));
        token.setExpirationDate(LocalDateTime.now().plusMinutes(settingsService.getPasswordResetTokenTtlMinutes()));
        token.setUsed(false);

        tokenRepository.save(token);
        return token.getToken();
    }

    @Override
    public boolean isValidToken(String token) {
        return tokenRepository.findByToken(token)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpirationDate().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    @Override
    public void markTokenAsUsed(String token) {
        tokenRepository.findByToken(token).ifPresent(t -> {
            t.setUsed(true);
            tokenRepository.save(t);
        });
    }

    @Override
    public boolean resetPassword(String token, String newPassword) {
        return tokenRepository.findByToken(token)
                .filter(t -> !t.isUsed())
                .filter(t -> t.getExpirationDate().isAfter(LocalDateTime.now()))
                .map(t -> {
                    User user = t.getUser();
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    t.setUsed(true);
                    tokenRepository.save(t);
                    return true;
                })
                .orElse(false);
    }
}

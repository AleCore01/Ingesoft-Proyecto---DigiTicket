package com.digiticket.service.auth;

import com.digiticket.domain.user.User;

public interface PasswordResetService {
    String createPasswordResetToken(User user);
    boolean isValidToken(String token);
    void markTokenAsUsed(String token);
    boolean resetPassword(String token, String newPassword);
}

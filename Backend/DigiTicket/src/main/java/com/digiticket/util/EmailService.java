package com.digiticket.util;

public interface EmailService {
    void sendResetPasswordEmail(String to, String token);
    void sendNotificationEmail(String to, String subject, String body);
}

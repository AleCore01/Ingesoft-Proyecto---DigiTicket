package com.digiticket.util.impl;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.internet.MimeMultipart;

@ExtendWith(MockitoExtension.class)
public class EmailServiceImplTest {

    @Mock
    JavaMailSender mailSender;

    EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender);
        setPrivate(emailService, "from", "no-reply@acme.com");
    }

    private static String extractAllText(MimeMessage msg) throws Exception {
        Object content = msg.getContent();
        if (content instanceof String s) {
            return s;
        }
        if (content instanceof Multipart mp) {
            return extractAllTextFromMultipart(mp);
        }
        return "";
    }


    private static String extractAllTextFromMultipart(Multipart mp) throws Exception {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < mp.getCount(); i++) {
            BodyPart part = mp.getBodyPart(i);
            Object pc = part.getContent();

            if ((part.isMimeType("text/html") || part.isMimeType("text/plain")) && pc instanceof String s) {
                out.append(s);
            }

            if (pc instanceof MimeMultipart nested) {
                out.append(extractAllTextFromMultipart(nested));
            }
        }
        return out.toString();
    }


    @Test
    void sendResetPasswordEmail() throws Exception {
        MimeMessage mime = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mime);

        emailService.sendResetPasswordEmail("user@acme.com", "ABC123");

        verify(mailSender).send(any(MimeMessage.class));

        String html = extractAllText(mime);
        String normalized = html.replaceAll("\\s+", "");
        assertTrue(normalized.contains("ABC123"), "El HTML del correo no contiene el token");
    }

    private static void setPrivate(Object target, String field, Object value) {
        try {
            var f = target.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

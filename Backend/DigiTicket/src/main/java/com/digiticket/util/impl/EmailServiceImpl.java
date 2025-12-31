package com.digiticket.util.impl;

import com.digiticket.util.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Override
    public void sendResetPasswordEmail(String to, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");


            String html = """
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Código de Validación</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
                            <tr>
                                <td align="center" style="padding: 40px 20px;">
                                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                                        <!-- Header con Logo -->
                                        <tr>
                                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                                <img src="cid:logo" alt="Logo" style="max-width: 150px; height: auto; margin-bottom: 20px;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Código de Validación</h1>
                                            </td>
                                        </tr>
                    
                                        <!-- Contenido Principal -->
                                        <tr>
                                            <td style="padding: 40px;">
                                                <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                    Hola,
                                                </p>
                                                <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                    Tu código para restablecer la contraseña es:
                                                </p>
                    
                                                <!-- Código de Validación -->
                                                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                                                    <tr>
                                                        <td align="center" style="padding: 24px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px; border: 2px dashed #667eea;">
                                                            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                                                {{TOKEN}}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                    
                                                <!-- Advertencia de Tiempo -->
                                                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                                    <tr>
                                                        <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                                                ⏱️ <strong>Este código expira en 15 minutos.</strong>
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                    
                                                <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                                    Si no solicitaste este código, puedes ignorar este correo de forma segura.
                                                </p>
                                            </td>
                                        </tr>
                    
                                        <!-- Footer -->
                                        <tr>
                                            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                                                <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                                    Este es un correo automático, por favor no respondas a este mensaje.
                                                </p>
                                                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                                    © {{YEAR}} Tu Empresa. Todos los derechos reservados.
                                                </p>
                                            </td>
                                        </tr>
                    
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """;

            String body = html
                    .replace("{{TOKEN}}", token)
                    .replace("{{YEAR}}", String.valueOf(java.time.Year.now().getValue()));

            helper.setText(body, true);
            helper.setTo(to);
            helper.setSubject("Recuperación de contraseña");
            helper.setFrom(from);
            helper.addInline("logo", new ClassPathResource("static/email/logo_blanco.png"), "image/png");

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo de recuperación", e);
        }
    }

    @Override
    public void sendNotificationEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String html = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>{{TITLE}}</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                                    <!-- Header con Logo -->
                                    <tr>
                                        <td style="padding: 32px 32px 16px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                            <img src="cid:logo" alt="Logo" style="max-width: 140px; height: auto; margin-bottom: 16px;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                                {{TITLE}}
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Contenido Principal -->
                                    <tr>
                                        <td style="padding: 32px;">
                                            <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                {{BODY}}
                                            </p>

                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0 0;">
                                                <tr>
                                                    <td style="padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                                                        <p style="margin: 0; color: #1d4ed8; font-size: 14px; line-height: 1.5;">
                                                            💡 Te recordamos que estos puntos son un beneficio por tus compras en DigiTicket.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                                Este es un correo automático, por favor no respondas a este mensaje.
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                                © {{YEAR}} DigiTicket. Todos los derechos reservados.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;

            String formattedBody = body.replace("\n", "<br>");

            String htmlBody = html
                    .replace("{{TITLE}}", subject)
                    .replace("{{BODY}}", formattedBody)
                    .replace("{{YEAR}}", String.valueOf(java.time.Year.now().getValue()));


            helper.setText(htmlBody, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(from);

            helper.addInline("logo", new ClassPathResource("static/email/logo_blanco.png"), "image/png");

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar correo de notificación", e);
        }
    }
}

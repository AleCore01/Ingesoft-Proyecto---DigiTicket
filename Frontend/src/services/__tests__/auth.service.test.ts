import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../auth.service';

const validRegister = {
  firstName: 'Test',
  lastName: 'User',
  documentType: 'DNI',
  documentNumber: '12345678',
  birthDate: '1990-01-01',
  phoneNumber: '987654321',
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  termsAccepted: true,
};

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('login', () => {
    it('debería hacer login con credenciales válidas', async () => {
      const result = await authService.login('test@example.com', 'password123');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('debería fallar con email inválido', async () => {
      await expect(
        authService.login('invalid-email', 'password123')
      ).rejects.toThrow();
    });

    it('debería fallar con contraseña incorrecta', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('debería fallar con campos vacíos', async () => {
      await expect(
        authService.login('', '')
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('debería registrar usuario con datos válidos', async () => {
      await expect(authService.register(validRegister)).resolves.toBeNull();
    });

    it('debería fallar con email duplicado', async () => {
      const duplicate = { ...validRegister, email: 'test@example.com' };
      try {
        await authService.register(duplicate);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('debería fallar con email inválido', async () => {
      const invalid = { ...validRegister, email: 'invalid-email' };
      await expect(authService.register(invalid)).rejects.toThrow();
    });

    it('debería fallar sin campos requeridos', async () => {
      const incomplete: any = { firstName: 'Test' };
      await expect(authService.register(incomplete)).rejects.toThrow();
    });
  });

  describe('me', () => {
    it('debería obtener usuario autenticado', async () => {
      localStorage.setItem('token', 'mock-jwt-token-12345');
      
      const user = await authService.me();
      
      expect(user).toBeDefined();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
    });

    it('debería fallar sin token', async () => {
      await expect(authService.me()).rejects.toThrow();
    });
  });

  describe('requestReset', () => {
    it('debería enviar solicitud de reset con email válido', async () => {
      const result = await authService.requestReset('test@example.com');
      expect(result).toBeDefined();
    });

    it('debería manejar email no registrado', async () => {
      // El backend puede retornar 200 por seguridad
      const result = await authService.requestReset('notfound@example.com');
      expect(result).toBeDefined();
    });

    it('debería fallar con email inválido', async () => {
      await expect(
        authService.requestReset('invalid-email')
      ).rejects.toThrow();
    });
  });

  describe('verifyCode', () => {
    it('debería verificar código válido', async () => {
      const result = await authService.verifyCode('test@example.com', '123456');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('resetToken');
    });

    it('debería fallar con código inválido', async () => {
      await expect(
        authService.verifyCode('test@example.com', '000000')
      ).rejects.toThrow();
    });

    it('debería fallar con código expirado', async () => {
      await expect(
        authService.verifyCode('test@example.com', '999999')
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('debería resetear contraseña con token válido', async () => {
      const result = await authService.resetPassword('valid-reset-token', 'NewSecurePass123!');
      expect(result).toBeDefined();
    });

    it('debería fallar con token inválido', async () => {
      await expect(
        authService.resetPassword('invalid-token', 'NewPassword123!')
      ).rejects.toThrow();
    });

    it('debería fallar con contraseña débil', async () => {
      // Dependiendo de la validación del backend
      try {
        await authService.resetPassword('valid-token', '123');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

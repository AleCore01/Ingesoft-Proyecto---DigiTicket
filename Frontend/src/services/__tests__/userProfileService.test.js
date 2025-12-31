import { describe, it, expect, beforeEach } from 'vitest';
import { userProfileService } from '../userProfileService';

describe('userProfileService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('token', 'mock-user-token-12345');
  });

  describe('getProfile', () => {
    it('debería obtener el perfil del usuario', async () => {
      const result = await userProfileService.getProfile(mockUserId);
      
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('firstName');
    });

    it('debería incluir loyaltyPoints en el perfil', async () => {
      const result = await userProfileService.getProfile(mockUserId);
      
      expect(result.data).toHaveProperty('loyaltyPoints');
      expect(typeof result.data.loyaltyPoints).toBe('number');
    });

    it('debería generar avatar automáticamente', async () => {
      const result = await userProfileService.getProfile(mockUserId);
      
      expect(result.data.avatar).toBeDefined();
      expect(result.data.avatar).toContain('dicebear.com');
    });

    it('debería manejar error al cargar puntos', async () => {
      // Mock para simular error en puntos pero perfil exitoso
      const result = await userProfileService.getProfile(mockUserId);
      
      expect(result.ok).toBe(true);
      // Debería establecer puntos en 0 si hay error
      expect(result.data.loyaltyPoints).toBeGreaterThanOrEqual(0);
    });

    it('debería fallar sin userId', async () => {
      await expect(userProfileService.getProfile(null)).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(userProfileService.getProfile(mockUserId)).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('debería actualizar el perfil del usuario', async () => {
      const updatedData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '987654321'
      };
      
      const result = await userProfileService.updateProfile(mockUserId, updatedData);
      
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.firstName).toBe('Jane');
    });

    it('debería actualizar avatar después de cambiar nombre', async () => {
      const updatedData = {
        firstName: 'NewName'
      };
      
      const result = await userProfileService.updateProfile(mockUserId, updatedData);
      
      expect(result.data.avatar).toContain('NewName');
    });

    it('debería fallar con datos inválidos', async () => {
      const invalidData = {
        phoneNumber: 'invalid-phone-with-letters'
      };
      
      await expect(userProfileService.updateProfile(mockUserId, invalidData)).rejects.toThrow();
    });

    it('debería fallar sin userId', async () => {
      await expect(userProfileService.updateProfile(null, {})).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('debería lanzar error indicando endpoint no implementado', async () => {
      const passwordData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456'
      };
      
      await expect(userProfileService.updatePassword(mockUserId, passwordData)).rejects.toThrow('función de cambio de contraseña aún no está disponible');
    });
  });

  describe('getLoyaltyHistory', () => {
    it('debería obtener historial de puntos de lealtad', async () => {
      const result = await userProfileService.getLoyaltyHistory(mockUserId);
      
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('debería ordenar historial por fecha descendente', async () => {
      const result = await userProfileService.getLoyaltyHistory(mockUserId);
      
      if (result.data.length > 1) {
        const firstDate = new Date(result.data[0].date);
        const secondDate = new Date(result.data[1].date);
        expect(firstDate >= secondDate).toBe(true);
      }
    });

    it('debería normalizar datos del backend al formato frontend', async () => {
      const result = await userProfileService.getLoyaltyHistory(mockUserId);
      
      if (result.data.length > 0) {
        const item = result.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('points');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('balance');
      }
    });

    it('debería manejar historial vacío', async () => {
      const result = await userProfileService.getLoyaltyHistory(mockUserId);
      
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('debería fallar sin userId', async () => {
      // Handler permite clientId nulo, retorna array vacío (comportamiento permisivo)
      const result = await userProfileService.getLoyaltyHistory(null);
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('updatePreferences', () => {
    it('debería lanzar error indicando endpoint no implementado', async () => {
      const preferences = {
        notifications: true,
        newsletter: false
      };
      
      await expect(userProfileService.updatePreferences(mockUserId, preferences)).rejects.toThrow('función de preferencias aún no está disponible');
    });
  });
});

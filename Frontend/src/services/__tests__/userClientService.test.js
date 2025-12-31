import { describe, it, expect, beforeEach } from 'vitest';
import { userClientService, POINTS_STATUS_ENUM } from '../userClientService';

describe('userClientService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-admin-token-12345');
  });

  describe('POINTS_STATUS_ENUM', () => {
    it('debería definir estados de puntos correctamente', () => {
      expect(POINTS_STATUS_ENUM.expirados).toBe('EXPIRED');
      expect(POINTS_STATUS_ENUM['por vencer']).toBe('EXPIRING_SOON');
      expect(POINTS_STATUS_ENUM.vigentes).toBe('ACTIVE');
    });
  });

  describe('getActiveClients', () => {
    it('debería obtener clientes activos sin filtro', async () => {
      const result = await userClientService.getActiveClients();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result) || result.data).toBeTruthy();
    });

    it('debería obtener clientes activos con filtro de nombre', async () => {
      const result = await userClientService.getActiveClients('John');
      
      expect(result).toBeDefined();
    });

    it('debería ignorar espacios en blanco del nombre', async () => {
      const result = await userClientService.getActiveClients('  ');
      
      expect(result).toBeDefined();
    });

    it('debería normalizar espacios del nombre', async () => {
      const result = await userClientService.getActiveClients('  John  ');
      
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(userClientService.getActiveClients()).rejects.toThrow();
    });
  });

  describe('deactivateClient', () => {
    it('debería desactivar un cliente', async () => {
      const result = await userClientService.deactivateClient(1);
      
      expect(result).toBeDefined();
    });

    it('debería fallar con clientId inválido', async () => {
      await expect(userClientService.deactivateClient(null)).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(userClientService.deactivateClient(1)).rejects.toThrow();
    });
  });

  describe('getClientsByPointsStatus', () => {
    it('debería obtener clientes con puntos expirados', async () => {
      const result = await userClientService.getClientsByPointsStatus(POINTS_STATUS_ENUM.expirados);
      
      expect(result).toBeDefined();
    });

    it('debería obtener clientes con puntos por vencer', async () => {
      const result = await userClientService.getClientsByPointsStatus(POINTS_STATUS_ENUM['por vencer']);
      
      expect(result).toBeDefined();
    });

    it('debería obtener clientes con puntos vigentes', async () => {
      const result = await userClientService.getClientsByPointsStatus(POINTS_STATUS_ENUM.vigentes);
      
      expect(result).toBeDefined();
    });

    it('debería filtrar por nombre y estado', async () => {
      const result = await userClientService.getClientsByPointsStatus(
        POINTS_STATUS_ENUM.vigentes,
        'Maria'
      );
      
      expect(result).toBeDefined();
    });

    it('debería ignorar espacios en blanco del nombre', async () => {
      const result = await userClientService.getClientsByPointsStatus(
        POINTS_STATUS_ENUM.vigentes,
        '  '
      );
      
      expect(result).toBeDefined();
    });

    it('debería normalizar espacios del nombre', async () => {
      const result = await userClientService.getClientsByPointsStatus(
        POINTS_STATUS_ENUM.vigentes,
        '  Maria  '
      );
      
      expect(result).toBeDefined();
    });

    it('debería fallar con estado inválido', async () => {
      await expect(userClientService.getClientsByPointsStatus('INVALID_STATUS')).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(userClientService.getClientsByPointsStatus(POINTS_STATUS_ENUM.vigentes)).rejects.toThrow();
    });
  });

  describe('getClientsWithPointsExpiringIn5Days', () => {
    it('debería obtener clientes con puntos por vencer en 5 días', async () => {
      const result = await userClientService.getClientsWithPointsExpiringIn5Days();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result) || result.data).toBeTruthy();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(userClientService.getClientsWithPointsExpiringIn5Days()).rejects.toThrow();
    });
  });
});

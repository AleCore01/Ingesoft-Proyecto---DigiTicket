import { describe, it, expect, beforeEach } from 'vitest';
import { adminService } from '../adminService';

describe('adminService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-admin-token-12345');
  });

  describe('getAll', () => {
    it('debería obtener todos los administradores', async () => {
      const admins = await adminService.getAll();
      
      expect(admins).toBeDefined();
      expect(Array.isArray(admins) || admins.data).toBeTruthy();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(adminService.getAll()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('debería obtener un administrador por ID', async () => {
      const admin = await adminService.getById(1);
      
      expect(admin).toBeDefined();
    });

    it('debería manejar ID inválido', async () => {
      await expect(adminService.getById(null)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('debería crear un nuevo administrador', async () => {
      const newAdmin = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'ADMIN'
      };
      
      const result = await adminService.create(newAdmin);
      expect(result).toBeDefined();
    });

    it('debería fallar con datos incompletos', async () => {
      const invalidAdmin = {
        firstName: 'John'
      };
      
      await expect(adminService.create(invalidAdmin)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debería actualizar un administrador existente', async () => {
      const updatedAdmin = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com'
      };
      
      const result = await adminService.update(1, updatedAdmin);
      expect(result).toBeDefined();
    });

    it('debería fallar con ID inválido', async () => {
      const updatedAdmin = { firstName: 'Jane' };
      
      await expect(adminService.update(null, updatedAdmin)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('debería eliminar un administrador', async () => {
      const result = await adminService.delete(1);
      expect(result).toBeDefined();
    });

    it('debería fallar con ID inválido', async () => {
      await expect(adminService.delete(null)).rejects.toThrow();
    });
  });

  describe('searchByName', () => {
    it('debería buscar administradores por nombre', async () => {
      const results = await adminService.searchByName('John');
      
      expect(results).toBeDefined();
    });

    it('debería manejar búsquedas vacías', async () => {
      const results = await adminService.searchByName('');
      
      expect(results).toBeDefined();
    });

    it('debería manejar búsquedas sin resultados', async () => {
      const results = await adminService.searchByName('NoExiste123');
      
      expect(results).toBeDefined();
    });
  });

  describe('searchByStatus', () => {
    it('debería buscar administradores activos', async () => {
      const results = await adminService.searchByStatus('ACTIVE');
      
      expect(results).toBeDefined();
    });

    it('debería buscar administradores inactivos', async () => {
      const results = await adminService.searchByStatus('INACTIVE');
      
      expect(results).toBeDefined();
    });

    it('debería manejar estado inválido', async () => {
      await expect(adminService.searchByStatus('INVALID_STATUS')).rejects.toThrow();
    });
  });
});

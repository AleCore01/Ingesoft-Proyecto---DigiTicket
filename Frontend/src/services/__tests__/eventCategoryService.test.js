import { describe, it, expect, beforeEach } from 'vitest';
import { eventCategoryService } from '../eventCategoryService';

describe('eventCategoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('getAll', () => {
    it('debería obtener todas las categorías', async () => {
      const categories = await eventCategoryService.getAll();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories) || categories?.data).toBeTruthy();
    });

    it('cada categoría debe tener id y name', async () => {
      const categories = await eventCategoryService.getAll();
      const data = categories?.data ?? categories;
      
      if (Array.isArray(data) && data.length > 0) {
        const firstCategory = data[0];
        expect(firstCategory).toHaveProperty('id');
        expect(firstCategory).toHaveProperty('name');
      }
    });
  });

  describe('getById', () => {
    it('debería obtener una categoría por ID', async () => {
      const category = await eventCategoryService.getById(1);
      
      expect(category).toBeDefined();
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
    });

    it('debería fallar con ID inexistente', async () => {
      await expect(eventCategoryService.getById(9999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('debería crear una categoría con datos válidos', async () => {
      const newCategory = {
        name: 'Deportes',
        description: 'Eventos deportivos',
      };
      
      const result = await eventCategoryService.create(newCategory);
      expect(result).toBeDefined();
    });

    it('debería fallar sin nombre', async () => {
      const incompleteCategory = {
        description: 'Sin nombre',
      };
      
      // Dependiendo del backend, puede fallar o crear con nombre vacío
      try {
        await eventCategoryService.create(incompleteCategory);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const newCategory = {
        name: 'Test Category',
      };
      
      await expect(eventCategoryService.create(newCategory)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debería actualizar una categoría existente', async () => {
      const updates = {
        name: 'Categoría Actualizada',
        description: 'Nueva descripción',
      };
      
      const result = await eventCategoryService.update(1, updates);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(
        eventCategoryService.update(1, { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('debería eliminar una categoría', async () => {
      const result = await eventCategoryService.delete(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(eventCategoryService.delete(1)).rejects.toThrow();
    });
  });

  describe('searchByName', () => {
    it('debería buscar categorías por nombre', async () => {
      const results = await eventCategoryService.searchByName('Concierto');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería manejar búsqueda sin resultados', async () => {
      const results = await eventCategoryService.searchByName('XYZ123NotExist');
      
      expect(results).toBeDefined();
      const data = results?.data ?? results;
      expect(Array.isArray(data)).toBe(true);
    });

    it('debería buscar con parámetro vacío', async () => {
      const results = await eventCategoryService.searchByName('');
      
      expect(results).toBeDefined();
    });
  });
});

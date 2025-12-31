import { describe, it, expect, beforeEach } from 'vitest';
import { localService } from '../localService';

describe('localService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('getAll', () => {
    it('debería obtener lista de locales', async () => {
      const locals = await localService.getAll();
      const data = locals?.data ?? locals;
      
      expect(data).toBeInstanceOf(Array);
    });

    it('cada local debe tener propiedades requeridas', async () => {
      const locals = await localService.getAll();
      const data = locals?.data ?? locals;
      
      if (data.length > 0) {
        const firstLocal = data[0];
        expect(firstLocal).toHaveProperty('id');
        expect(firstLocal).toHaveProperty('name');
      }
    });
  });

  describe('getById', () => {
    it('debería obtener un local por ID', async () => {
      const local = await localService.getById(1);
      const data = local?.data ?? local;
      
      expect(data).toBeDefined();
      expect(data).toHaveProperty('id', 1);
    });

    it('debería fallar con ID inexistente', async () => {
      await expect(localService.getById(9999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('debería crear un local con datos completos', async () => {
      const newLocal = {
        name: 'Nuevo Local Test',
        address: 'Av. Test 123',
        cityId: 1,
        districtId: 1,
        capacity: 500,
        status: 'ACTIVE',
      };
      
      const result = await localService.create(newLocal);
      expect(result).toBeDefined();
    });

    it('debería fallar sin datos', async () => {
      await expect(localService.create(null)).rejects.toThrow('Datos de local requeridos');
    });

    it('debería fallar sin nombre', async () => {
      const incompleteLocal = {
        address: 'Av. Test 123',
        cityId: 1,
        districtId: 1,
      };
      
      await expect(localService.create(incompleteLocal)).rejects.toThrow('El nombre del local es requerido');
    });

    it('debería fallar con nombre vacío', async () => {
      const incompleteLocal = {
        name: '   ',
        address: 'Av. Test 123',
        cityId: 1,
        districtId: 1,
      };
      
      await expect(localService.create(incompleteLocal)).rejects.toThrow('El nombre del local es requerido');
    });

    it('debería fallar sin dirección', async () => {
      const incompleteLocal = {
        name: 'Local Test',
        cityId: 1,
        districtId: 1,
      };
      
      await expect(localService.create(incompleteLocal)).rejects.toThrow('La dirección es requerida');
    });

    it('debería fallar sin ciudad', async () => {
      const incompleteLocal = {
        name: 'Local Test',
        address: 'Av. Test 123',
        districtId: 1,
      };
      
      await expect(localService.create(incompleteLocal)).rejects.toThrow('La ciudad es requerida');
    });

    it('debería fallar sin distrito', async () => {
      const incompleteLocal = {
        name: 'Local Test',
        address: 'Av. Test 123',
        cityId: 1,
      };
      
      await expect(localService.create(incompleteLocal)).rejects.toThrow('El distrito es requerido');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const newLocal = {
        name: 'Test',
        address: 'Test 123',
        cityId: 1,
        districtId: 1,
      };
      
      await expect(localService.create(newLocal)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debería actualizar un local existente', async () => {
      const updates = {
        name: 'Nombre Actualizado',
        capacity: 600,
      };
      
      const result = await localService.update(1, updates);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const updates = { name: 'Nuevo nombre' };
      await expect(localService.update(1, updates)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('debería eliminar un local', async () => {
      const result = await localService.delete(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(localService.delete(1)).rejects.toThrow();
    });
  });

  describe('searchByName', () => {
    it('debería buscar locales por nombre', async () => {
      const results = await localService.searchByName('Teatro');
      const data = results?.data ?? results;
      
      expect(data).toBeInstanceOf(Array);
    });

    it('debería manejar búsqueda sin resultados', async () => {
      const results = await localService.searchByName('XYZ123NoExiste');
      const data = results?.data ?? results;
      
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(0);
    });
  });

  describe('searchByStatus', () => {
    it('debería buscar locales por estado', async () => {
      const results = await localService.searchByStatus('ACTIVE');
      const data = results?.data ?? results;
      
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('searchByDistrict', () => {
    it('debería buscar locales por distrito', async () => {
      const results = await localService.searchByDistrict('Miraflores');
      const data = results?.data ?? results;
      
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('countEvents', () => {
    it('debería contar eventos asociados a un local', async () => {
      const result = await localService.countEvents(1);
      const count = result?.data ?? result;
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('city', () => {
    describe('getAll', () => {
      it('debería obtener lista de ciudades', async () => {
        const cities = await localService.city.getAll();
        const data = cities?.data ?? cities;
        
        expect(data).toBeInstanceOf(Array);
      });

      it('cada ciudad debe tener id y nombre', async () => {
        const cities = await localService.city.getAll();
        const data = cities?.data ?? cities;
        
        if (data.length > 0) {
          const firstCity = data[0];
          expect(firstCity).toHaveProperty('id');
          expect(firstCity).toHaveProperty('name');
        }
      });
    });
  });

  describe('district', () => {
    describe('getAll', () => {
      it('debería obtener lista de distritos', async () => {
        const districts = await localService.district.getAll();
        const data = districts?.data ?? districts;
        
        expect(data).toBeInstanceOf(Array);
      });
    });

    describe('getByCity', () => {
      it('debería obtener distritos de una ciudad', async () => {
        const districts = await localService.district.getByCity(1);
        const data = districts?.data ?? districts;
        
        expect(data).toBeInstanceOf(Array);
      });

      it('cada distrito debe tener id, nombre y cityId', async () => {
        const districts = await localService.district.getByCity(1);
        const data = districts?.data ?? districts;
        
        if (data.length > 0) {
          const firstDistrict = data[0];
          expect(firstDistrict).toHaveProperty('id');
          expect(firstDistrict).toHaveProperty('name');
          expect(firstDistrict).toHaveProperty('cityId', 1);
        }
      });

      it('debería manejar ciudad sin distritos', async () => {
        const districts = await localService.district.getByCity(9999);
        const data = districts?.data ?? districts;
        
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toBe(0);
      });
    });
  });

  describe('bulkImport', () => {
    it.skip('debería importar locales desde CSV', async () => {
      // Skip: FormData con MSW tiene problemas conocidos de timeout
      // Los handlers están implementados pero MSW no intercepta FormData correctamente
      const csvContent = 'name,address,cityId,districtId\nLocal CSV,Av Test,1,1';
      const file = new File([csvContent], 'locals.csv', { type: 'text/csv' });
      
      const result = await localService.bulkImport(file);
      expect(result).toBeDefined();
      expect(result.imported).toBeGreaterThan(0);
    });

    it.skip('debería fallar con archivo inválido', async () => {
      // Skip: FormData con MSW tiene problemas conocidos de timeout
      const file = new File(['invalid'], 'invalid.txt', { type: 'text/plain' });
      
      await expect(localService.bulkImport(file)).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      await expect(localService.bulkImport(file)).rejects.toThrow();
    });
  });
});

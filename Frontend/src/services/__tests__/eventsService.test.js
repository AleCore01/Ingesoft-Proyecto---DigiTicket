import { describe, it, expect, beforeEach } from 'vitest';
import { eventsService } from '../eventsService';

describe('eventsService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('getAll', () => {
    it('debería obtener lista de eventos', async () => {
      const events = await eventsService.getAll();
      
      expect(events).toBeInstanceOf(Array);
      expect(events.length).toBeGreaterThan(0);
    });

    it('cada evento debe tener propiedades requeridas', async () => {
      const events = await eventsService.getAll();
      const firstEvent = events[0];
      
      expect(firstEvent).toHaveProperty('id');
      expect(firstEvent).toHaveProperty('title');
      expect(firstEvent).toHaveProperty('date');
    });
  });

  describe('getById', () => {
    it('debería obtener un evento por ID', async () => {
      const event = await eventsService.getById(1);
      
      expect(event).toBeDefined();
      expect(event.id).toBe(1);
      expect(event).toHaveProperty('title');
    });

    it('debería fallar con ID inexistente', async () => {
      await expect(eventsService.getById(9999)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('debería crear un evento con datos completos', async () => {
      const newEvent = {
        title: 'Nuevo Evento Test',
        description: 'Descripción del evento',
        startsAt: '2025-12-25T20:00:00',
        eventCategoryId: 1,
        locationId: 1,
      };
      
      const result = await eventsService.create(newEvent);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });

    it('debería normalizar payload removiendo imageBase64 vacío', async () => {
      const newEvent = {
        title: 'Evento Test',
        startsAt: '2025-12-25T20:00:00',
        eventCategoryId: 1,
        imageBase64: '',
      };
      
      const result = await eventsService.create(newEvent);
      expect(result).toBeDefined();
    });

    it('debería mantener imageBase64 cuando tiene valor', async () => {
      const newEvent = {
        title: 'Evento Test',
        startsAt: '2025-12-25T20:00:00',
        eventCategoryId: 1,
        imageBase64: 'data:image/png;base64,iVBORw0KGg...',
      };
      
      const result = await eventsService.create(newEvent);
      expect(result).toBeDefined();
    });

    it('debería fallar sin datos de evento', async () => {
      await expect(eventsService.create(null)).rejects.toThrow('Datos de evento requeridos');
    });

    it('debería fallar sin título', async () => {
      const incompleteEvent = {
        date: '2025-12-25T20:00:00Z',
        categoryId: 1,
      };
      
      await expect(eventsService.create(incompleteEvent)).rejects.toThrow('El título del evento es requerido');
    });

    it('debería fallar con título vacío', async () => {
      const incompleteEvent = {
        title: '   ',
        date: '2025-12-25T20:00:00Z',
        categoryId: 1,
      };
      
      await expect(eventsService.create(incompleteEvent)).rejects.toThrow('El título del evento es requerido');
    });

    it('debería fallar sin fecha', async () => {
      const incompleteEvent = {
        title: 'Evento sin fecha',
        eventCategoryId: 1,
      };
      
      await expect(eventsService.create(incompleteEvent)).rejects.toThrow('La fecha del evento es requerida');
    });

    it('debería fallar sin categoría', async () => {
      const incompleteEvent = {
        title: 'Evento Test',
        startsAt: '2025-12-25T20:00:00',
      };
      
      await expect(eventsService.create(incompleteEvent)).rejects.toThrow('La categoría del evento es requerida');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const newEvent = {
        title: 'Evento Test',
        startsAt: '2025-12-25T20:00:00',
        eventCategoryId: 1,
      };
      
      await expect(eventsService.create(newEvent)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('debería actualizar un evento existente', async () => {
      const updates = {
        title: 'Título Actualizado',
        description: 'Nueva descripción',
      };
      
      const result = await eventsService.update(1, updates);
      expect(result).toBeDefined();
    });

    it('debería normalizar payload en actualización', async () => {
      const updates = {
        title: 'Título Actualizado',
        imageBase64: '',
      };
      
      const result = await eventsService.update(1, updates);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const updates = { title: 'Nuevo título' };
      await expect(eventsService.update(1, updates)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('debería eliminar un evento', async () => {
      const result = await eventsService.delete(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(eventsService.delete(1)).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('debería buscar eventos sin filtros', async () => {
      const results = await eventsService.search();
      
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería buscar eventos por título', async () => {
      const results = await eventsService.search({ title: 'Concierto' });
      
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería buscar eventos por status', async () => {
      const results = await eventsService.search({ status: 'ACTIVE' });
      
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería buscar eventos por rango de fechas', async () => {
      const results = await eventsService.search({
        from: '2025-12-01',
        to: '2025-12-31',
      });
      
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería manejar fechas como objetos Date', async () => {
      const from = new Date('2025-12-01');
      const to = new Date('2025-12-31');
      
      const results = await eventsService.search({ from, to });
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });

    it('debería buscar eventos por ubicación', async () => {
      const results = await eventsService.search({ locationId: 1 });
      
      expect(Array.isArray(results) || results?.data).toBeTruthy();
    });
  });

  describe('publish', () => {
    it('debería publicar un evento', async () => {
      const result = await eventsService.publish(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(eventsService.publish(1)).rejects.toThrow();
    });
  });

  describe('cancel', () => {
    it('debería cancelar un evento', async () => {
      const result = await eventsService.cancel(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(eventsService.cancel(1)).rejects.toThrow();
    });
  });

  describe('finish', () => {
    it('debería finalizar un evento', async () => {
      const result = await eventsService.finish(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(eventsService.finish(1)).rejects.toThrow();
    });
  });

  describe('bulkImport', () => {
    it.skip('debería importar eventos desde CSV', async () => {
      // Skip: FormData con MSW tiene problemas conocidos de timeout
      // Los handlers están implementados pero MSW no intercepta FormData correctamente
      const csvContent = 'title,date,categoryId\nEvento CSV,2025-12-25,1';
      const file = new File([csvContent], 'events.csv', { type: 'text/csv' });
      
      const result = await eventsService.bulkImport(file);
      expect(result).toBeDefined();
      expect(result.imported).toBeGreaterThan(0);
    });

    it.skip('debería fallar con archivo inválido', async () => {
      // Skip: FormData con MSW tiene problemas conocidos de timeout
      const file = new File(['invalid'], 'invalid.txt', { type: 'text/plain' });
      
      await expect(eventsService.bulkImport(file)).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      await expect(eventsService.bulkImport(file)).rejects.toThrow();
    });
  });
});

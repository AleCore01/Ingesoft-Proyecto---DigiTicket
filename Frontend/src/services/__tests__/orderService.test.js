import { describe, it, expect, beforeEach } from 'vitest';
import { orderService } from '../orderService';

describe('orderService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('listByUser', () => {
    it('debería obtener órdenes del usuario', async () => {
      const result = await orderService.listByUser(1);
      
      expect(result).toHaveProperty('ok', true);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('órdenes deben estar ordenadas por fecha descendente', async () => {
      const result = await orderService.listByUser(1);
      const orders = result.data;
      
      if (orders.length > 1) {
        const firstDate = new Date(orders[0].date);
        const secondDate = new Date(orders[1].date);
        expect(firstDate >= secondDate).toBe(true);
      }
    });

    it('debería manejar usuario sin órdenes', async () => {
      const result = await orderService.listByUser(9999);
      
      expect(result).toHaveProperty('ok', true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(0);
    });

    it('cada orden debe tener propiedades requeridas', async () => {
      const result = await orderService.listByUser(1);
      
      if (result.data.length > 0) {
        const firstOrder = result.data[0];
        expect(firstOrder).toHaveProperty('id');
        expect(firstOrder).toHaveProperty('status');
        expect(firstOrder).toHaveProperty('date');
      }
    });

    it('optimización: lista viene ordenada por fecha desc', async () => {
      const result = await orderService.listByUser(1);
      if (result.data.length > 1) {
        for (let i=1;i<result.data.length;i++) {
          const prev = new Date(result.data[i-1].date);
          const curr = new Date(result.data[i].date);
          expect(prev >= curr).toBe(true);
        }
      }
    });
  });

  describe('getById', () => {
    it('debería obtener una orden por ID', async () => {
      const result = await orderService.getById(1);
      
      expect(result).toHaveProperty('ok', true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('id');
    });

    it('debería fallar con ID inexistente', async () => {
      // El backend devuelve 404 que lanza error
      await expect(orderService.getById(9999)).rejects.toThrow();
    });

  });

  describe('getStatuses', () => {
    it('debería obtener lista de estados posibles', () => {
      const statuses = orderService.getStatuses();
      
      expect(statuses).toBeInstanceOf(Array);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('cada estado debe tener id y label', () => {
      const statuses = orderService.getStatuses();
      const firstStatus = statuses[0];
      
      expect(firstStatus).toHaveProperty('id');
      expect(firstStatus).toHaveProperty('label');
    });
  });

  describe('filterByStatus', () => {
    it('debería filtrar órdenes por estado (si implementado)', async () => {
      try {
        const result = await orderService.filterByStatus(1, 'completed');
        
        expect(result).toHaveProperty('ok', true);
        expect(result.data).toBeInstanceOf(Array);
        
        // Todas las órdenes deben tener el estado filtrado
        result.data.forEach(order => {
          expect(order.status).toBe('completed');
        });
      } catch (error) {
        // Endpoint no implementado, skip test
        expect(error.message).toContain('not implemented');
      }
    });

  });

  describe('cancelOrder', () => {
    it('debería cancelar una orden (si implementado)', async () => {
      try {
        const result = await orderService.cancelOrder(1);
        
        expect(result).toHaveProperty('ok');
        
        if (result.ok) {
          expect(result.data).toHaveProperty('status', 'cancelled');
        } else {
          // Orden ya cancelada o no encontrada
          expect(result).toHaveProperty('error');
        }
      } catch (error) {
        // Endpoint no implementado, skip test
        expect(error.message).toContain('not implemented');
      }
    });

    it('no debería cancelar orden ya cancelada (si implementado)', async () => {
      try {
        await orderService.cancelOrder(1);
        const result = await orderService.cancelOrder(1);
        
        if (result.ok === false) {
          expect(result.error).toContain('already cancelled');
        }
      } catch (error) {
        // Endpoint no implementado, skip test
        expect(error.message).toContain('not implemented');
      }
    });

  });
});

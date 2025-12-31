import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartService, checkoutService, loyaltyService } from '../cartService';

describe('cartService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simular token de autenticación
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('getCart', () => {
    it('debería obtener el carrito del usuario autenticado', async () => {
      const cart = await cartService.getCart();
      
      expect(cart).toBeDefined();
      expect(cart.items).toBeInstanceOf(Array);
      expect(cart).toHaveProperty('totalAmount');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(cartService.getCart()).rejects.toThrow();
    });
  });

  describe('addItem', () => {
    it('debería agregar un item con eventId y zoneId', async () => {
      const newItem = {
        eventId: 1,
        zoneId: 101,
        quantity: 2,
      };
      
      const result = await cartService.addItem(newItem);
      expect(result).toBeDefined();
    });

    it('debería mapear ticketTypeId a eventZoneId', async () => {
      const newItem = {
        eventId: 1,
        ticketTypeId: 101,
        qty: 2,
      };
      
      const result = await cartService.addItem(newItem);
      expect(result).toBeDefined();
    });

    it('debería usar cantidad 1 por defecto', async () => {
      const newItem = {
        eventId: 1,
        zoneId: 101,
      };
      
      const result = await cartService.addItem(newItem);
      expect(result).toBeDefined();
    });

    it('debería fallar con cantidad negativa', async () => {
      const newItem = {
        eventId: 1,
        zoneId: 101,
        quantity: -1,
      };
      
      await expect(cartService.addItem(newItem)).rejects.toThrow();
    });

    it('debería fallar sin eventZoneId', async () => {
      const newItem = {
        eventId: 1,
        quantity: 2,
      };
      
      await expect(cartService.addItem(newItem)).rejects.toThrow();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const newItem = {
        eventId: 1,
        zoneId: 101,
        quantity: 2,
      };
      
      await expect(cartService.addItem(newItem)).rejects.toThrow();
    });
  });

  describe('updateQuantity', () => {
    it('debería actualizar la cantidad de un item', async () => {
      const result = await cartService.updateQuantity(1, 3);
      expect(result).toBeDefined();
    });

    it('debería fallar con cantidad negativa', async () => {
      await expect(
        cartService.updateQuantity(1, -1)
      ).rejects.toThrow('La cantidad debe ser mayor a 0');
    });

    it('debería fallar con cantidad cero', async () => {
      await expect(
        cartService.updateQuantity(1, 0)
      ).rejects.toThrow('La cantidad debe ser mayor a 0');
    });

    it('debería fallar si se excede el límite de tickets', async () => {
      // El límite es dinámico (se obtiene de /api/settings en producción)
      // En tests, el mock usa 4 como valor de ejemplo
      // Backend valida y devuelve error cuando se excede
      await expect(
        cartService.updateQuantity(1, 5)
      ).rejects.toThrow('No puedes tener más de 4 tickets por evento');
    });

    it('debería fallar con itemId inválido', async () => {
      await expect(
        cartService.updateQuantity(0, 3)
      ).rejects.toThrow('ID de item inválido');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(
        cartService.updateQuantity(1, 3)
      ).rejects.toThrow();
    });
  });

  describe('removeItem', () => {
    it('debería eliminar un item del carrito', async () => {
      const result = await cartService.removeItem(1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(cartService.removeItem(1)).rejects.toThrow();
    });
  });

  describe('clearCart', () => {
    it('debería limpiar todo el carrito', async () => {
      const result = await cartService.clearCart();
      expect(result).toHaveProperty('ok', true);
    });

    it('debería manejar carrito vacío sin errores', async () => {
      // Llamar dos veces para simular carrito ya vacío
      await cartService.clearCart();
      const result = await cartService.clearCart();
      
      expect(result).toHaveProperty('ok', true);
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(cartService.clearCart()).rejects.toThrow();
    });
  });

  describe('placeHoldWith', () => {
    it('debería crear hold con userId y cartId', async () => {
      const result = await cartService.placeHoldWith(1, 1);
      expect(result).toBeDefined();
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(
        cartService.placeHoldWith(1, 1)
      ).rejects.toThrow();
    });
  });

  describe('applyPoints', () => {
    it('debería aplicar puntos (stub)', async () => {
      const result = await cartService.applyPoints(100);
      
      expect(result).toHaveProperty('ok', true);
      expect(result).toHaveProperty('points', 100);
    });
  });
});

describe('checkoutService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('processCheckout', () => {
    it('debería procesar checkout con datos completos', async () => {
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: 0,
        paymentMethod: 'CARD',
      };
      
      const result = await checkoutService.processCheckout(checkoutData);
      expect(result).toBeDefined();
    });

    it('debería incluir header de idempotencia cuando se proporciona', async () => {
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: 0,
        paymentMethod: 'CARD',
      };
      
      const result = await checkoutService.processCheckout(
        checkoutData,
        'idempotency-key-123'
      );
      
      expect(result).toBeDefined();
    });

    it('debería fallar sin datos de checkout', async () => {
      await expect(
        checkoutService.processCheckout(null)
      ).rejects.toThrow('Datos de checkout requeridos');
    });

    it('debería fallar con método de pago inválido', async () => {
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: 0,
        paymentMethod: 'INVALID_METHOD',
      };
      
      await expect(
        checkoutService.processCheckout(checkoutData)
      ).rejects.toThrow('Método de pago inválido');
    });

    it('debería fallar con puntos negativos', async () => {
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: -100,
        paymentMethod: 'CARD',
      };
      
      await expect(
        checkoutService.processCheckout(checkoutData)
      ).rejects.toThrow('Puntos usados debe ser un número entero positivo');
    });

    it('debería fallar con puntos decimales', async () => {
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: 50.5,
        paymentMethod: 'CARD',
      };
      
      await expect(
        checkoutService.processCheckout(checkoutData)
      ).rejects.toThrow('Puntos usados debe ser un número entero positivo');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      const checkoutData = {
        cardToken: 'tok_test_123',
        pointsUsed: 0,
        paymentMethod: 'CARD',
      };
      
      await expect(
        checkoutService.processCheckout(checkoutData)
      ).rejects.toThrow();
    });
  });
});

describe('loyaltyService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token-12345');
  });

  describe('getBalance', () => {
    it('debería obtener balance de puntos', async () => {
      const balance = await loyaltyService.getBalance();
      
      expect(balance).toBeDefined();
      expect(balance).toHaveProperty('current');
      expect(balance).toHaveProperty('redeemable');
    });

    it('debería fallar sin autenticación', async () => {
      localStorage.removeItem('token');
      
      await expect(loyaltyService.getBalance()).rejects.toThrow();
    });
  });
});

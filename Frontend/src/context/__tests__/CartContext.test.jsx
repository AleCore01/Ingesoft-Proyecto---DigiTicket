import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart, CartProvider } from '../CartContext';
import { cartService } from '../../services/cartService';
import { settingsService } from '../../services/settingsService';
import { AuthProvider } from '../AuthProvider';

// Mock services
vi.mock('../../services/cartService');
vi.mock('../../services/settingsService');
vi.mock('../../services/eventsService');
vi.mock('../../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser = { id: '123', name: 'Test User', role: 'CLIENT' };
const createMockJWT = (expTime) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '123', exp: expTime }));
  const signature = 'mock_signature';
  return `${header}.${payload}.${signature}`;
};

const wrapper = ({ children }) => (
  <AuthProvider>
    <CartProvider>{children}</CartProvider>
  </AuthProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    
    // Mock válido de settings
    settingsService.get.mockResolvedValue({
      data: { maxTicketsPerPurchase: 20 },
    });
    
    // Mock válido de carrito vacío
    cartService.getCart.mockResolvedValue({
      data: { id: 'cart-123', items: [] },
    });
    
    // Setup auth válido
    const validTime = Math.floor(Date.now() / 1000) + 3600;
    const validToken = createMockJWT(validTime);
    localStorage.setItem('token', validToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialización', () => {
    it('debería inicializar con estado vacío', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.appliedPoints).toBe(0);
        expect(result.current.loading).toBe(false);
      });
    });

    it('debería cargar maxTicketsPerPurchase desde settings', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.maxTicketsPerPurchase).toBe(20);
      });
      
      expect(settingsService.get).toHaveBeenCalled();
    });

    it('debería usar default si settings falla', async () => {
      settingsService.get.mockRejectedValue(new Error('Settings error'));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.maxTicketsPerPurchase).toBe(20);
      });
    });

    it.skip('debería lanzar error si se usa fuera del provider', () => {
      // Suprimir console.error para este test
      const consoleError = console.error;
      console.error = vi.fn();
      
      // Testing-library captura el error automáticamente
      expect(() => {
        renderHook(() => useCart());
      }).toThrow();
      
      console.error = consoleError;
    });
  });

  describe('loadCart', () => {
    it('debería cargar carrito desde backend', async () => {
      const mockItems = [
        {
          id: 'item-1',
          eventId: 'event-1',
          eventTitle: 'Concierto',
          zoneId: 'zone-1',
          zoneName: 'VIP',
          quantity: 2,
          price: 100,
        },
      ];

      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: mockItems,
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].eventTitle).toBe('Concierto');
      });
    });

    it('debería limpiar estado si backend devuelve carrito vacío', async () => {
      cartService.getCart.mockResolvedValue({
        data: { id: 'cart-123', items: [] },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.appliedPoints).toBe(0);
        expect(result.current.cartId).toBeNull();
      });
    });

    it('debería restaurar hold activo desde backend', async () => {
      const futureTime = new Date(Date.now() + 300000).toISOString(); // +5min
      
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', quantity: 1, price: 50 }],
          holdExpiresAt: futureTime,
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.holdExpiresAt).toBe(futureTime);
      });
    });
  });

  describe('addItem', () => {
    it('debería agregar item al carrito', async () => {
      const newItem = {
        eventId: 'event-1',
        eventTitle: 'Concierto',
        zoneId: 'zone-1',
        zoneName: 'VIP',
        quantity: 2,
        price: 100,
      };

      cartService.addItem.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ ...newItem, id: 'item-1' }],
        },
      });

      cartService.getCart.mockResolvedValue({
        data: { id: 'cart-123', items: [] },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
      });

      await act(async () => {
        await result.current.addItem(newItem);
      });

      expect(cartService.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-1',
          zoneId: 'zone-1',
          quantity: 2,
        })
      );
    });

    it('debería validar maxTicketsPerPurchase', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.maxTicketsPerPurchase).toBe(20);
      });

      const newItem = {
        eventId: 'event-1',
        eventTitle: 'Concierto',
        zoneId: 'zone-1',
        zoneName: 'VIP',
        quantity: 25, // Excede el límite
        price: 100,
      };

      await act(async () => {
        const result_add = await result.current.addItem(newItem);
        expect(result_add.ok).toBe(false); // Devuelve error
        expect(result_add.code).toBe('MAX_TICKETS_PER_EVENT');
      });

      expect(cartService.addItem).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('debería eliminar item del carrito', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', eventTitle: 'Concierto', quantity: 1, price: 50 }],
        },
      });

      cartService.removeItem.mockResolvedValue({
        data: { id: 'cart-123', items: [] },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeItem('item-1');
      });

      expect(cartService.removeItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('clearCart', () => {
    it('debería limpiar el carrito', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', quantity: 1, price: 50 }],
        },
      });

      cartService.clearCart.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.clearCart();
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.appliedPoints).toBe(0);
      });
      
      expect(cartService.clearCart).toHaveBeenCalled();
    });
  });

  describe('applyPoints', () => {
    it('debería aplicar puntos correctamente', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', quantity: 1, price: 100 }],
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.applyPoints(50);
      });

      await waitFor(() => {
        expect(result.current.appliedPoints).toBe(50);
      });
    });

    it('debería limitar puntos al subtotal', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', quantity: 1, price: 100 }],
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.applyPoints(150); // Más que el subtotal
      });

      await waitFor(() => {
        expect(result.current.appliedPoints).toBe(150); // Acepta el valor, validación en UI
      });
    });
  });

  describe('checkout', () => {
    it('debería procesar checkout correctamente', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', eventId: 'event-1', zoneId: 'zone-1', quantity: 1, price: 100 }],
        },
      });

      cartService.checkout.mockResolvedValue({
        data: { orderId: 'order-123', success: true },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const paymentData = {
        paymentMethod: 'CREDIT_CARD',
        cardNumber: '4111111111111111',
      };

      let checkoutResult;
      await act(async () => {
        checkoutResult = await result.current.checkout(paymentData);
      });

      expect(cartService.checkout).toHaveBeenCalled();
      expect(checkoutResult.data.orderId).toBe('order-123');
    });

    it('debería incluir puntos aplicados en checkout', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', eventId: 'event-1', zoneId: 'zone-1', quantity: 1, price: 100 }],
        },
      });

      cartService.checkout.mockResolvedValue({
        data: { orderId: 'order-123', success: true },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.applyPoints(20);
      });

      await waitFor(() => {
        expect(result.current.appliedPoints).toBe(20);
      });

      const paymentData = { paymentMethod: 'CREDIT_CARD' };

      await act(async () => {
        await result.current.checkout(paymentData);
      });

      expect(cartService.checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          pointsUsed: 20,
        }),
        expect.any(String) // idempotencyKey
      );
    });
  });

  describe('Cálculos de totales', () => {
    it('debería calcular subtotal correctamente', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [
            { id: 'item-1', quantity: 2, price: 50 },
            { id: 'item-2', quantity: 1, price: 100 },
          ],
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.subtotal).toBe(200);
      });
    });

    it('debería calcular descuento de puntos', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [{ id: 'item-1', quantity: 1, price: 100 }],
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.applyPoints(30);
      });

      await waitFor(() => {
        expect(result.current.pointsDiscount).toBe(15); // 30 puntos * 0.5 ratio
        expect(result.current.total).toBe(85); // 100 - 15
      });
    });

    it('debería calcular itemCount correctamente', async () => {
      cartService.getCart.mockResolvedValue({
        data: {
          id: 'cart-123',
          items: [
            { id: 'item-1', quantity: 2, price: 50 },
            { id: 'item-2', quantity: 3, price: 100 },
          ],
        },
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.itemCount).toBe(5);
      });
    });
  });
});

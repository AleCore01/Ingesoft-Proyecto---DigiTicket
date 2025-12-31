import { mockOrders, mockOrderStatuses } from '../mocks/ordersData';
import { api } from './http';
import { ORDERS_PREFIX } from '../constants/api';

// Mantener deshabilitado mock en producción; solo se usa para ejemplos locales.
const USE_MOCK_DATA = false; // backend real por defecto

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const orderService = {
  listByUser: async (userId) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      const orders = mockOrders.filter(order => order.userId === userId);
      return {
        ok: true,
        data: orders.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    }
    // Backend: /api/orders/user/{userId}
    const data = await api.get(`${ORDERS_PREFIX}/user/${userId}`);
    // Optimización: devolver ordenadas por fecha desc igual que mock.
    const sorted = Array.isArray(data) ? [...data].sort((a,b)=> new Date(b.date) - new Date(a.date)) : data;
    return { ok: true, data: sorted };
  },

  getById: async (orderId) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      const order = mockOrders.find(o => o.id === parseInt(orderId));
      if (!order) {
        return { ok: false, error: 'Order not found' };
      }
      return { ok: true, data: order };
    }
    // TODO: implementar endpoint de detalle si es necesario
    const data = await api.get(`${ORDERS_PREFIX}/${orderId}`);
    return { ok: true, data };
  },

  getStatuses: () => {
    return mockOrderStatuses;
  },

  filterByStatus: async (userId, status) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const orders = mockOrders.filter(
        order => order.userId === userId && order.status === status
      );
      return {
        ok: true,
        data: orders.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  },

  cancelOrder: async (orderId) => {
    if (USE_MOCK_DATA) {
      await delay(600);
      const order = mockOrders.find(o => o.id === orderId);
      if (!order) {
        return { ok: false, error: 'Order not found' };
      }
      if (order.status === 'cancelled') {
        return { ok: false, error: 'Order already cancelled' };
      }
      order.status = 'cancelled';
      return { ok: true, data: order };
    }
    
    throw new Error('Backend endpoint not implemented yet');
  }
};

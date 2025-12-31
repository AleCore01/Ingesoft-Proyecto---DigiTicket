// src/services/cartService.js
import { api } from './http'
import { CART_PREFIX, CHECKOUT_PREFIX, LOYALTY_PREFIX } from '../constants/api'

/**
 * Servicio para interactuar con el Carrito de Compras (Dev 2)
 * 
 * DTOs del Backend:
 * - CartDTO { id, items: CartItemDTO[], total }
 * - CartItemDTO { id, eventId, ticketTypeId, qty, unitPrice, subtotal }
 * 
 * Reglas de Negocio:
 * - Máximo N tickets por evento (configurable desde backend)
 * - Requiere autenticación (JWT)
 */
export const cartService = {
  /**
   * GET /api/cart
   * Obtiene el carrito activo del usuario actual
   * @returns {Promise<CartDTO>} { id, items: CartItemDTO[], total }
   */
  getCart: () => api.get(CART_PREFIX),

  /**
   * POST /api/cart/items
   * Agrega un item al carrito
   * Validación: El backend valida el límite máximo de tickets
   * 
   * @param {Object} item - Datos del item a agregar
   * @param {number} item.eventId - ID del evento
   * @param {number} item.ticketTypeId - ID del tipo de ticket (zona)
   * @param {number} item.qty - Cantidad de tickets
   * @returns {Promise<CartDTO>} Carrito actualizado
   */
  addItem: (item) => {
    // Validar cantidad antes de mapear
    const quantity = item.quantity || item.qty || 1;
    if (quantity <= 0) {
      return Promise.reject(new Error('La cantidad debe ser mayor a 0'));
    }
    // La validación del límite se hace en el backend
    
    // Validar eventZoneId requerido
    const eventZoneId = item.zoneId || item.ticketTypeId;
    if (!eventZoneId) {
      return Promise.reject(new Error('Se requiere ID de zona/ticket'));
    }
    if (!item.eventId) {
      return Promise.reject(new Error('Se requiere ID de evento'));
    }
    
    // Mapear desde nuestro modelo frontend al del backend
    const payload = {
      eventId: item.eventId,
      eventZoneId: eventZoneId, // ✅ Backend espera eventZoneId, no ticketTypeId
      qty: quantity,
    }
    
    console.log('🔄 [cartService] POST /api/cart/items')
    console.log('  📥 Frontend:', item)
    console.log('  📤 Backend:', payload)
    
    return api.post(`${CART_PREFIX}/items`, payload)
  },

  /**
   * PATCH /api/cart/items/{id}
   * Actualiza la cantidad de un item
   * Validación: El backend valida el límite máximo de tickets
   * 
   * @param {number} itemId - ID del item en el carrito
   * @param {number} quantity - Nueva cantidad
   * @returns {Promise<CartDTO>} Carrito actualizado
   */
  updateQuantity: (itemId, quantity) => {
    console.log(`🔄 [cartService] PATCH /api/cart/items/${itemId}`, { qty: quantity })
    
    // Validar cantidad
    if (quantity <= 0) {
      return Promise.reject(new Error('La cantidad debe ser mayor a 0'))
    }
    // La validación del límite se hace en el backend
    if (!itemId || itemId <= 0) {
      return Promise.reject(new Error('ID de item inválido'))
    }
    
    return api.patch(`${CART_PREFIX}/items/${itemId}`, { qty: quantity })
  },

  /**
   * DELETE /api/cart/items/{id}
   * Elimina un item del carrito
   * 
   * @param {number} itemId - ID del item
   * @returns {Promise<CartDTO>} Carrito actualizado
   */
  removeItem: (itemId) => {
    console.log(`🔄 [cartService] DELETE /api/cart/items/${itemId}`)
    return api.delete(`${CART_PREFIX}/items/${itemId}`)
  },

  /**
   * Limpia todo el carrito (elimina todos los items)
   * Nota: El backend no tiene endpoint DELETE /api/cart,
   * por lo que eliminamos cada item individualmente
   * 
   * @returns {Promise<void>}
   */
  clearCart: async () => {
    console.log('🔄 [cartService] Limpiando carrito...')
    try {
      const cart = await api.get(CART_PREFIX)
      const items = cart?.items ?? []
      
      if (items.length === 0) {
        console.log('  ℹ️ Carrito ya está vacío')
        return { ok: true }
      }
      
      // Eliminar cada item
      await Promise.all(
        items.map(item => api.delete(`${CART_PREFIX}/items/${item.id}`))
      )
      
      console.log(`  ✅ ${items.length} items eliminados`)
      return { ok: true }
    } catch (error) {
      console.error('  ❌ Error limpiando carrito:', error)
      throw error
    }
  },

  /**
   * POST /api/cart/hold
   * Crea una reserva temporal (hold) de los items en el carrito.
   * Congela el stock por un período limitado.
   * TTL: ~10 minutos (configurable en backend)
   * 
   * @param {number|string} userId - ID del usuario
   * @param {number|string} cartId - ID del carrito
   * @param {Array} items - Items del carrito a reservar
   * @returns {Promise<HoldResult>} { holdId, expiresAt }
   */
  placeHold: (userId, cartId, items) => {
    console.log(`🔄 [cartService] POST /api/cart/hold`, { userId, cartId, items })
    // Backend requiere userId y cartId en el body
    return api.post(`${CART_PREFIX}/hold`, { userId, cartId, items })
  },

  /**
   * POST /api/cart/hold (versión simplificada)
   * Crea una reserva temporal con solo userId y cartId
   * 
   * @param {number|string} userId - ID del usuario
   * @param {number|string} cartId - ID del carrito
   * @returns {Promise<HoldResult>} { holdId, expiresAt }
   */
  placeHoldWith: (userId, cartId) => {
    console.log(`🔄 [cartService] POST /api/cart/hold (simplified)`, { userId, cartId })
    return api.post(`${CART_PREFIX}/hold`, { userId, cartId })
  },

  /**
   * Aplica puntos de lealtad al carrito
   * 
   * @param {number} points - Cantidad de puntos a aplicar
   * @returns {Promise<{ok: boolean, points: number}>}
   */
  applyPoints: (points) => {
    console.log(`🔄 [cartService] Aplicando ${points} puntos`)
    // Por ahora es un stub - el backend no tiene este endpoint aún
    return Promise.resolve({ ok: true, points })
  },
  
  /**
   * POST /api/checkout
   * Procesa el checkout (alias para checkoutService.processCheckout)
   * 
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<OrderReceipt>}
   */
  checkout: (paymentData, idempotencyKey = null) => {
    return checkoutService.processCheckout(paymentData, idempotencyKey)
  },
}

/**
 * Servicio para Checkout y Ventas (Dev 4)
 * 
 * DTOs del Backend:
 * - CheckoutRequest { redeemPoints: int, cardToken: string }
 * - OrderReceipt { orderId, total, totalPaid, status, items[] }
 */
export const checkoutService = {
  /**
   * POST /api/checkout
   * Procesa el pago y confirma la orden
   * 
   * Flujo:
   * 1. Verifica hold vigente
   * 2. Calcula total - descuentos por puntos
   * 3. Llama PaymentSimulator
   * 4. Crea order/order_items + payment
   * 5. Confirma hold si aprobado; libera si declinado
   * 
   * @param {Object} checkoutData
   * @param {number} checkoutData.redeemPoints - Puntos a canjear (opcional)
   * @param {string} checkoutData.cardToken - Token de tarjeta simulado
   * @param {string} idempotencyKey - Header para evitar duplicados (opcional)
   * @returns {Promise<OrderReceipt>} { orderId, total, totalPaid, status, items[] }
   */
  processCheckout: (checkoutData, idempotencyKey = null) => {
    console.log('🔄 [checkoutService] POST /api/checkout')
    console.log('  📤 Datos:', checkoutData)
    
    // Validar datos de checkout
    if (!checkoutData) {
      return Promise.reject(new Error('Datos de checkout requeridos'))
    }
    
    const validPaymentMethods = ['CARD', 'WALLET', 'POINTS']
    if (checkoutData.paymentMethod && !validPaymentMethods.includes(checkoutData.paymentMethod)) {
      return Promise.reject(new Error(`Método de pago inválido. Debe ser: ${validPaymentMethods.join(', ')}`))
    }
    
    if (checkoutData.pointsUsed && (checkoutData.pointsUsed < 0 || !Number.isInteger(checkoutData.pointsUsed))) {
      return Promise.reject(new Error('Puntos usados debe ser un número entero positivo'))
    }
    
    // Generar Idempotency-Key automáticamente si no se proporciona
    if (!idempotencyKey) {
      idempotencyKey = `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const headers = {
      'Idempotency-Key': idempotencyKey
    }
    
    console.log('  🔑 Idempotency-Key:', idempotencyKey)
    
    return api.post(CHECKOUT_PREFIX, checkoutData, { headers })
  },
}

/**
 * Servicio de Puntos de Lealtad (Dev 5)
 * 
 * DTOs del Backend:
 * - PointsBalanceDTO { current: int, redeemable: int }
 */
export const loyaltyService = {
  /**
   * GET /api/loyalty/balance
   * Obtiene el saldo de puntos del usuario
   * 
   * @returns {Promise<PointsBalanceDTO>} { current, redeemable }
   */
  getBalance: () => {
    console.log('🔄 [loyaltyService] GET /api/loyalty/balance')
    return api.get(`${LOYALTY_PREFIX}/balance`)
  },
}

/**
 * Servicio de Historial de Órdenes (Dev 5)
 * 
 * DTOs del Backend:
 * - OrderSummary { orderId, createdAt, totalPaid, events: string[] }
 */
export const orderService = {
  /**
   * GET /api/orders/history
   * Lista el historial de órdenes del usuario (paginado)
   * 
   * @param {number} page - Número de página (default: 0)
   * @param {number} size - Tamaño de página (default: 10)
   * @returns {Promise<Page<OrderSummary>>}
   */
  getHistory: (page = 0, size = 10) => {
    console.log(`🔄 [orderService] GET /api/orders/history?page=${page}&size=${size}`)
    return api.get(`${LOYALTY_PREFIX.replace('/loyalty', '/orders')}/history`, {
      params: { page, size }
    })
  },
}

// src/types/cart.ts
// DTOs del Backend para el sistema de compras

/**
 * TicketTypeDTO - Información de tipo de ticket (Dev 1)
 */
export interface TicketTypeDTO {
  id: number
  eventId: number
  name: string
  price: number
  stockAvailable: number  // stock físico - holds vigentes
}

/**
 * CartItemDTO - Item del carrito (Dev 2)
 */
export interface CartItemDTO {
  id: number
  eventId: number
  ticketTypeId: number
  qty: number
  unitPrice: number
  subtotal: number
}

/**
 * CartDTO - Carrito del usuario (Dev 2)
 */
export interface CartDTO {
  id: number
  items: CartItemDTO[]
  total: number
}

/**
 * HoldResult - Resultado de reserva temporal (Dev 3)
 */
export interface HoldResult {
  holdId: number
  expiresAt: string  // ISO 8601 datetime
}

/**
 * CheckoutRequest - Datos para checkout (Dev 4)
 */
export interface CheckoutRequest {
  cardToken: string
  pointsUsed: number
  paymentMethod: 'CARD' | 'WALLET' | 'POINTS'
}

/**
 * OrderItemDTO - Item de una orden
 */
export interface OrderItemDTO {
  eventId: number
  ticketTypeId: number
  qty: number
  unitPrice: number
  subtotal: number
}

/**
 * OrderReceipt - Recibo de orden (Dev 4)
 */
export interface OrderReceipt {
  orderId: number
  total: number
  totalPaid: number
  status: 'PAID' | 'FAILED' | 'CANCELLED'
  items: OrderItemDTO[]
}

/**
 * OrderSummary - Resumen de orden para historial (Dev 5)
 */
export interface OrderSummary {
  orderId: number
  createdAt: string
  totalPaid: number
  events: string[]
}

/**
 * PointsBalanceDTO - Saldo de puntos de lealtad (Dev 5)
 */
export interface PointsBalanceDTO {
  current: number
  redeemable: number
}

/**
 * PaymentStatus - Estados del pago simulado
 */
export type PaymentStatus = 'APPROVED' | 'DECLINED'

/**
 * HoldStatus - Estados de una reserva temporal
 */
export type HoldStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED'

/**
 * OrderStatus - Estados de una orden
 */
export type OrderStatus = 'PAID' | 'FAILED' | 'CANCELLED'

// ===== Interfaces extendidas para el Frontend =====

/**
 * CartItemExtended - Item del carrito con información adicional del frontend
 * Combina CartItemDTO con datos del evento para mejor UX
 */
export interface CartItemExtended extends CartItemDTO {
  // Datos adicionales obtenidos del evento
  eventTitle?: string
  eventImage?: string
  eventDate?: string
  eventLocation?: string
  zoneName?: string  // Alias de ticketTypeName para consistencia
  
  // Alias para compatibilidad con componentes existentes
  zoneId?: number     // = ticketTypeId
  quantity?: number   // = qty
  price?: number      // = unitPrice
}

/**
 * CartState - Estado del carrito en el contexto del frontend
 */
export interface CartState {
  items: CartItemExtended[]
  subtotal: number
  total: number
  appliedPoints: number
  holdId?: number
  holdExpiresAt?: string
  loading: boolean
  error: string | null
}

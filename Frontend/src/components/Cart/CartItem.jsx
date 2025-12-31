import React from 'react'
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useCart } from '../../context/CartContext'

/**
 * Componente para mostrar un item del carrito
 * Regla de negocio: Máximo N tickets por evento (configurable desde backend)
 */
const CartItem = ({ item, onUpdateQuantity, onRemove, disabled, allItems = [] }) => {
  const { maxTicketsPerPurchase = 4 } = useCart() // Default 4 si no está disponible
  /**
   * Calcula cuántos tickets del mismo evento hay en total (excluyendo este item)
   */
  const getOtherTicketsForEvent = () => {
    return allItems
      .filter(i => i.eventId === item.eventId && i.id !== item.id)
      .reduce((sum, i) => sum + i.quantity, 0)
  }

  /**
   * Calcula cuántos tickets más se pueden agregar a este item
   */
  const getRemainingSlots = () => {
    const otherTickets = getOtherTicketsForEvent()
    return Math.max(0, maxTicketsPerPurchase - otherTickets - item.quantity)
  }

  /**
   * Verifica si se puede aumentar la cantidad
   */
  const canIncrease = () => {
    const otherTickets = getOtherTicketsForEvent()
    return (otherTickets + item.quantity) < maxTicketsPerPurchase
  }

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    } else {
      onRemove(item.id)
    }
  }

  const handleIncrease = () => {
    // VALIDACIÓN: Máximo N tickets por evento (configurable)
    if (canIncrease()) {
      onUpdateQuantity(item.id, item.quantity + 1)
    }
  }

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* Imagen del evento */}
      <div className="flex-shrink-0">
        {item.eventImage ? (
          <img
            src={`data:image/jpeg;base64,${item.eventImage}`}
            alt={item.eventTitle}
            className="w-20 h-20 object-cover rounded-lg"
          />
        ) : (
          // Placeholder SVG local en lugar de via.placeholder.com
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-purple-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {item.eventTitle}
        </h3>
        <p className="text-sm text-gray-600">Zona: {item.zoneName}</p>
        {item.eventDate && (
          <p className="text-xs text-gray-500">
            {new Date(item.eventDate).toLocaleDateString('es-PE')}
          </p>
        )}
        {item.eventLocation && (
          <p className="text-xs text-gray-500">{item.eventLocation}</p>
        )}
      </div>

      {/* Controles de cantidad */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={handleDecrease}
            disabled={disabled}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
            aria-label="Disminuir cantidad"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={handleIncrease}
            disabled={disabled || !canIncrease()}
            title={!canIncrease() ? `Máximo ${maxTicketsPerPurchase} tickets por evento` : ''}
            className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aumentar cantidad"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Advertencia si está cerca del límite */}
        {canIncrease() && getRemainingSlots() <= 1 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle size={12} />
            <span>Límite: 4/evento</span>
          </div>
        )}

        {/* Precio */}
        <p className="font-bold text-gray-900">
          S/. {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          S/. {(item.price || 0).toFixed(2)} c/u
        </p>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={disabled}
        className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
        aria-label="Eliminar del carrito"
      >
        <Trash2 size={20} />
      </button>
    </div>
  )
}

export default CartItem

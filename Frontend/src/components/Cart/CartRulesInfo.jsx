import React from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useCart } from '../../context/CartContext'

/**
 * Componente informativo sobre las reglas del carrito
 * Muestra visualmente el estado de la regla de máx. tickets por evento (configurable desde backend)
 */
const CartRulesInfo = ({ items = [] }) => {
  const { maxTicketsPerPurchase } = useCart();
  const maxTickets = maxTicketsPerPurchase ?? 4; // Fallback mientras carga
  // Agrupar items por evento
  const eventGroups = items.reduce((acc, item) => {
    if (!acc[item.eventId]) {
      acc[item.eventId] = {
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        items: [],
        totalTickets: 0
      }
    }
    acc[item.eventId].items.push(item)
    acc[item.eventId].totalTickets += item.quantity
    return acc
  }, {})

  const events = Object.values(eventGroups)
  const hasViolations = events.some(e => e.totalTickets > maxTickets)
  const hasWarnings = events.some(e => e.totalTickets === maxTickets)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
         Reglas del Carrito
      </h3>

      {/* Regla principal */}
      <div className="mb-4 p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={20} className="text-fuchsia-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-fuchsia-900">
              Máximo {maxTickets} tickets por evento
            </p>
            <p className="text-xs text-fuchsia-700 mt-1">
              Puedes comprar tickets de múltiples eventos, pero no más de {maxTickets} entradas del mismo evento.
            </p>
          </div>
        </div>
      </div>

      {/* Estado por evento */}
      {events.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Estado por evento:
          </p>
          {events.map((event) => {
            const isValid = event.totalTickets <= maxTickets
            const isFull = event.totalTickets === maxTickets
            const progress = (event.totalTickets / maxTickets) * 100

            return (
              <div
                key={event.eventId}
                className={`p-3 rounded-lg border ${
                  !isValid
                    ? 'bg-red-50 border-red-200'
                    : isFull
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {event.eventTitle}
                    </p>
                    <p className="text-xs text-gray-600">
                      {event.items.map(i => `${i.zoneName} (${i.quantity})`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isValid ? (
                      <XCircle size={20} className="text-red-600" />
                    ) : isFull ? (
                      <AlertCircle size={20} className="text-amber-600" />
                    ) : (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        !isValid
                          ? 'bg-red-500'
                          : isFull
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mensaje de estado */}
                <div className="flex justify-between items-center text-xs">
                  <span
                    className={
                      !isValid
                        ? 'text-red-700 font-semibold'
                        : isFull
                        ? 'text-amber-700 font-semibold'
                        : 'text-green-700'
                    }
                  >
                    {!isValid
                      ? `Excede límite: ${event.totalTickets}/${maxTickets}`
                      : isFull
                      ? `✓ Límite alcanzado: ${maxTickets}/${maxTickets}`
                      : `${event.totalTickets}/${maxTickets} tickets`}
                  </span>
                  {isValid && !isFull && (
                    <span className="text-gray-600">
                      Puedes agregar {maxTickets - event.totalTickets} más
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Tu carrito está vacío
        </p>
      )}

      {/* Advertencias globales */}
      {hasViolations && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
            <XCircle size={16} />
            Hay eventos que exceden el límite de {maxTickets} tickets
          </p>
          <p className="text-xs text-red-700 mt-1">
            Por favor, reduce la cantidad de tickets en los eventos marcados antes de continuar.
          </p>
        </div>
      )}

      {/* Resumen final */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total de eventos:</span>
          <span className="font-semibold text-gray-900">{events.length}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Total de tickets:</span>
          <span className="font-semibold text-gray-900">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Estado:</span>
          <span
            className={`font-semibold ${
              hasViolations ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {hasViolations ? '❌ Inválido' : '✅ Válido'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CartRulesInfo

import React from 'react'
import { ShoppingCart, Ticket, CreditCard } from 'lucide-react'

/**
 * Componente de resumen de orden
 */
const OrderSummary = ({
  subtotal,
  pointsDiscount,
  appliedPoints,
  total,
  itemCount,
  onApplyPoints,
  userPoints = 0,
  showPointsSection = true,
}) => {
  const [pointsInput, setPointsInput] = React.useState('')

  const handleApplyPoints = () => {
    const points = parseInt(pointsInput, 10)
    if (isNaN(points) || points <= 0) return
    
    // Validar que no supere puntos disponibles
    if (points > userPoints) {
      alert(`Solo tienes ${userPoints} puntos disponibles`)
      return
    }
    
    // Validar que el descuento no supere el subtotal (10 puntos = S/1)
    const discount = points / 10
    if (discount > subtotal) {
      const maxPoints = Math.floor(subtotal * 10)
      alert(`El descuento no puede superar el subtotal. M\u00e1ximo: ${maxPoints} puntos`)
      return
    }
    
    onApplyPoints?.(points)
    setPointsInput('')
  }

  const handleClearPoints = () => {
    onApplyPoints?.(0)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart size={24} className="text-fuchsia-600" />
        Resumen de compra
      </h2>

      {/* Items count */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <Ticket size={18} />
        <span>
          {itemCount} {itemCount === 1 ? 'entrada' : 'entradas'}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span className="font-semibold">S/. {(subtotal || 0).toFixed(2)}</span>
        </div>

        {/* Puntos canjeados */}
        {appliedPoints > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuento ({appliedPoints} puntos):</span>
            <span className="font-semibold">- S/. {(pointsDiscount || 0).toFixed(2)}</span>
          </div>
        )}

        {/* Línea divisora */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total:</span>
            <span className="text-fuchsia-600">S/. {(total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sección de puntos */}
      {showPointsSection && (
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Puntos canjeables</h3>
          <p className="text-sm text-gray-600 mb-3">
            Tienes <span className="font-bold text-fuchsia-600">{userPoints}</span> puntos
            disponibles
          </p>

          {appliedPoints > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 mb-2">
                ✓ {appliedPoints} puntos aplicados
              </p>
              <button
                onClick={handleClearPoints}
                className="text-sm text-red-600 hover:text-red-700 font-semibold"
              >
                Quitar puntos
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max={userPoints}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder="Puntos a canjear"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <button
                onClick={handleApplyPoints}
                disabled={!pointsInput || parseInt(pointsInput) > userPoints}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Canjear
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            10 puntos = S/. 1.00 de descuento
          </p>
        </div>
      )}

      {/* Nota informativa */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
        <CreditCard size={16} className="inline mr-1" />
        Aceptamos todas las tarjetas de crédito y débito
      </div>
    </div>
  )
}

export default OrderSummary

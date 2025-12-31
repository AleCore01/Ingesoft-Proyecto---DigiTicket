import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { eventsService } from '../../services/eventsService'
import { useAuth } from '../../context/AuthProvider'
import { logger } from '../../utils/logger'

/**
 * Modal para agregar entradas al carrito
 * Regla de negocio: Máximo N tickets por evento (configurable desde backend)
 */
const AddToCartModal = ({ isOpen, onClose, event, zones, onAddToCart }) => {
  const [selections, setSelections] = useState({})
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [purchasedTickets, setPurchasedTickets] = useState(0)
  const [loadingLimit, setLoadingLimit] = useState(true)
  const { items, maxTicketsPerPurchase } = useCart()
  const { user } = useAuth()
  
  // Usar 20 como fallback mientras carga (debería ser casi instantáneo)
  const maxTickets = maxTicketsPerPurchase ?? 20

  // Cargar información de tickets ya comprados cuando se abre el modal
  useEffect(() => {
    if (isOpen && event && user) {
      setLoadingLimit(true)
      logger.log('[AddToCartModal] 🔍 Iniciando consulta de límite...')
      logger.log('[AddToCartModal] Event ID:', event.id, 'User ID:', user.id)
      
      eventsService.getPurchaseLimit(event.id, user.id)
        .then(response => {
          logger.log('[AddToCartModal] ✅ Respuesta RAW completa:', response)
          logger.log('[AddToCartModal] Tipo de respuesta:', typeof response)
          logger.log('[AddToCartModal] Keys de respuesta:', Object.keys(response))
          
          // Intentar diferentes formas de acceder a los datos
          const data = response.data || response
          logger.log('[AddToCartModal] Data extraído:', data)
          
          const purchased = data.alreadyPurchased || 0
          setPurchasedTickets(purchased)
          
          logger.log('[AddToCartModal] 📊 Resumen:')
          logger.log('  - Event ID:', event.id)
          logger.log('  - User ID:', user.id)
          logger.log('  - Tickets comprados/transferidos:', purchased)
          logger.log('  - Límite máximo:', data.maxTicketsPerUser || data.maxTicketsPerPurchase || maxTickets)
          logger.log('  - Restantes según backend:', data.remaining)
        })
        .catch(error => {
          logger.error('[AddToCartModal] ❌ Error cargando límite de compra:', error)
          logger.error('[AddToCartModal] Error completo:', {
            message: error.message,
            status: error.status,
            data: error.data,
            stack: error.stack
          })
          setPurchasedTickets(0) // Asumir 0 si falla
        })
        .finally(() => {
          setLoadingLimit(false)
        })
    } else {
      logger.log('[AddToCartModal] ⏭️ Saltando consulta:', { isOpen, hasEvent: !!event, hasUser: !!user })
      setPurchasedTickets(0)
      setLoadingLimit(false)
    }
  }, [isOpen, event, user, maxTickets])

  if (!isOpen) return null

  /**
   * Obtiene la cantidad total de tickets del evento actual en el carrito
   */
  const getTicketsInCartForEvent = () => {
    return items
      .filter(item => item.eventId === event.id)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  /**
   * Obtiene la cantidad total seleccionada en el modal
   */
  const getTotalSelected = () => {
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0)
  }

  /**
   * Obtiene el total de tickets para este evento (carrito + seleccionados)
   */
  const getTotalForEvent = () => {
    return getTicketsInCartForEvent() + getTotalSelected()
  }

  /**
   * Calcula cuántos tickets más se pueden agregar considerando comprados + carrito
   */
  const getRemainingSlots = () => {
    const totalOwned = purchasedTickets + getTicketsInCartForEvent()
    return Math.max(0, maxTickets - totalOwned)
  }

  /**
   * Calcula el total acumulado: comprados + en carrito + seleccionados
   */
  const getTotalAccumulated = () => {
    return purchasedTickets + getTicketsInCartForEvent() + getTotalSelected()
  }

  const handleQuantityChange = (zoneId, delta) => {
    setError('') // Limpiar error previo
    
    setSelections((prev) => {
      const current = prev[zoneId] || 0
      const newValue = current + delta
      
      // Validar que no sea negativo
      if (newValue < 0) return prev
      
      // Calcular el nuevo total si se aplica este cambio
      const currentTotal = getTotalSelected()
      const newTotal = currentTotal - current + newValue
      const totalAccumulated = purchasedTickets + getTicketsInCartForEvent() + newTotal
      
      //VALIDACIÓN: Máximo N tickets por evento (configurable)
      if (totalAccumulated > maxTickets) {
        const messages = []
        if (purchasedTickets > 0) messages.push(`${purchasedTickets} comprado${purchasedTickets !== 1 ? 's' : ''}`)
        if (getTicketsInCartForEvent() > 0) messages.push(`${getTicketsInCartForEvent()} en carrito`)
        const currentStatus = messages.length > 0 ? ` Ya tienes ${messages.join(' + ')}.` : ''
        setError(`Solo puedes tener máximo ${maxTickets} tickets para este evento.${currentStatus}`)
        return prev
      }
      
      if (newValue === 0) {
        const { [zoneId]: _, ...rest } = prev
        return rest
      }
      
      return { ...prev, [zoneId]: newValue }
    })
  }

  const getTotalItems = () => {
    return getTotalSelected()
  }

  const getTotalPrice = () => {
    return Object.entries(selections).reduce((sum, [zoneId, qty]) => {
      const zone = zones.find((z) => z.id === parseInt(zoneId))
      return sum + (zone?.price || 0) * qty
    }, 0)
  }

  const handleAddToCart = async () => {
    if (getTotalItems() === 0) return

    setAdding(true)
    setError('')
    let allSuccess = true
    
    try {
      // 🚀 OPTIMIZACIÓN: Agregar todos los items en paralelo en lugar de secuencialmente
      const addPromises = Object.entries(selections).map(async ([zoneId, quantity]) => {
        const zone = zones.find((z) => z.id === parseInt(zoneId))
        if (zone && quantity > 0) {
          const itemToAdd = {
            eventId: event.id,
            eventTitle: event.title,
            eventImage: event.imageBase64,
            eventDate: event.startsAt,
            eventLocation: event.locationName,
            zoneId: zone.id,
            zoneName: zone.displayName,
            price: zone.price,
            quantity,
          }
          return onAddToCart(itemToAdd)
        }
        return { ok: true }
      })

      // Esperar a que todos se completen
      const results = await Promise.all(addPromises)
      
      // Verificar si alguno falló
      const failedResult = results.find(r => r && r.error)
      if (failedResult) {
        setError(failedResult.error)
        allSuccess = false
      }
      
      if (allSuccess) {
        setSelections({})
        onClose()
      }
    } catch (error) {
      setError('Error al agregar al carrito. Intenta nuevamente.')
      logger.error('[AddToCartModal] Error agregando al carrito:', error)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Selecciona tus entradas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Evento info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">{event?.title}</h3>
          <p className="text-sm text-gray-600">
            {event?.startsAt && new Date(event.startsAt).toLocaleDateString('es-PE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Zones list */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Información de límite y estado */}
          <div className="mb-4 p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-fuchsia-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-fuchsia-900 font-semibold">
                  Máximo {maxTickets} tickets por evento
                </p>
                {loadingLimit ? (
                  <div className="mt-1 text-xs text-fuchsia-700">
                    Cargando información...
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-fuchsia-700 space-y-1">
                    <div className="space-y-0.5">
                      <div>
                        • <span className="font-bold">{purchasedTickets}</span> ticket{purchasedTickets !== 1 ? 's' : ''} ya comprado{purchasedTickets !== 1 ? 's' : ''} / transferido{purchasedTickets !== 1 ? 's' : ''}
                      </div>
                      <div>
                        • <span className="font-bold">{getTicketsInCartForEvent()}</span> ticket{getTicketsInCartForEvent() !== 1 ? 's' : ''} en tu carrito
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-t border-fuchsia-300">
                      {getRemainingSlots() > 0 ? (
                        <>Puedes agregar <span className="font-bold text-green-700">{getRemainingSlots()}</span> ticket{getRemainingSlots() !== 1 ? 's' : ''} más.</>
                      ) : (
                        <span className="font-bold text-red-600">⚠️ Has alcanzado el límite de {maxTickets} tickets para este evento.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {zones && zones.length > 0 ? (
              zones.map((zone) => {
                const quantity = selections[zone.id] || 0
                const isAvailable = zone.seatsQuota > 0

                return (
                  <div
                    key={zone.id}
                    className={`
                      border rounded-lg p-4 transition
                      ${quantity > 0 ? 'border-fuchsia-600 bg-fuchsia-50' : 'border-gray-300'}
                      ${!isAvailable ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{zone.displayName}</h4>
                        <p className="text-sm text-gray-600">
                          Disponibles: {zone.seatsQuota} | Precio: S/. {(zone.price || 0).toFixed(2)}
                        </p>
                      </div>

                      {isAvailable && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(zone.id, -1)}
                            disabled={quantity === 0}
                            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(zone.id, 1)}
                            disabled={getRemainingSlots() <= 0}
                            title={getRemainingSlots() <= 0 ? `Máximo ${maxTickets} tickets por evento` : ''}
                            className="p-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}

                      {!isAvailable && (
                        <span className="text-sm text-red-600 font-semibold">
                          Agotado
                        </span>
                      )}
                    </div>

                    {quantity > 0 && (
                      <div className="text-right text-sm text-gray-700">
                        Subtotal: <span className="font-bold">S/. {((zone.price || 0) * quantity).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay zonas disponibles para este evento
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">
                Total de entradas: <span className="font-bold">{getTotalItems()}</span>
              </p>
              <p className="text-2xl font-bold text-fuchsia-600">
                S/. {(getTotalPrice() || 0).toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={getTotalItems() === 0 || adding || getRemainingSlots() === 0 || loadingLimit}
              className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={20} />
              {adding ? 'Agregando...' : loadingLimit ? 'Cargando...' : getRemainingSlots() === 0 ? 'Límite alcanzado' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddToCartModal

import React, { useState } from 'react'
import CreditCardPreview from './CreditCardPreview'

/**
 * Formulario de pago con tarjeta de crédito/débito
 */
const CardPaymentForm = ({ paymentData, setPaymentData }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  /**
   * Formatea el número de tarjeta mientras se escribe
   */
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '') // Eliminar espacios
    value = value.replace(/\D/g, '') // Solo números
    
    // Limitar a 16 dígitos (19 con espacios)
    if (value.length > 16) {
      value = value.slice(0, 16)
    }
    
    setPaymentData({ ...paymentData, cardNumber: value })
  }
  
  /**
   * Formatea la fecha de expiración MM/AA
   */
  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // Solo números
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    
    setPaymentData({ ...paymentData, expiryDate: value })
  }
  
  /**
   * Solo permite números en CVV
   */
  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Solo números
    setPaymentData({ ...paymentData, cvv: value })
  }
  
  return (
    <div className="space-y-6">
      {/* Vista previa animada de la tarjeta */}
      <CreditCardPreview
        cardNumber={paymentData.cardNumber}
        cardName={paymentData.cardName}
        expiryDate={paymentData.expiryDate}
        cvv={paymentData.cvv}
        isFlipped={isFlipped}
      />
      
      {/* Formulario */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de tarjeta
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              value={paymentData.cardNumber}
              onChange={handleCardNumberChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre en la tarjeta
            </label>
            <input
              type="text"
              placeholder="JUAN PÉREZ"
              value={paymentData.cardName}
              onChange={(e) =>
                setPaymentData({ ...paymentData, cardName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de expiración
            </label>
            <input
              type="text"
              placeholder="MM/AA"
              maxLength="5"
              value={paymentData.expiryDate}
              onChange={handleExpiryDateChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CVV
            </label>
            <input
              type="text"
              placeholder="123"
              maxLength="3"
              value={paymentData.cvv}
              onChange={handleCvvChange}
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardPaymentForm

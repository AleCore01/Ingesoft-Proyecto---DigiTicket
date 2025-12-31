import React from 'react'
import { CreditCard } from 'lucide-react'

/**
 * Selector de método de pago (Tarjeta o Yape)
 */
const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-8 mb-4">
        {/* Opción Tarjeta */}
        <button
          onClick={() => setPaymentMethod('card')}
          className="relative flex items-center gap-2"
        >
          <CreditCard 
            size={24} 
            className={`transition-colors ${
              paymentMethod === 'card' ? 'text-fuchsia-600' : 'text-gray-400'
            }`}
          />
          <span className={`text-base transition-colors ${
            paymentMethod === 'card' ? 'text-gray-800' : 'text-gray-400'
          }`}>
            Tarjeta
          </span>
          {paymentMethod === 'card' && (
            <div className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-fuchsia-600"></div>
          )}
        </button>

        {/* Opción Yape */}
        <button
          onClick={() => setPaymentMethod('yape')}
          className="relative flex items-center gap-2"
        >
          <img 
            src="/logo_yape.png" 
            alt="Yape" 
            className={`h-6 transition-opacity ${
              paymentMethod === 'yape' ? 'opacity-100' : 'opacity-40'
            }`}
          />
          <span className={`text-base transition-colors ${
            paymentMethod === 'yape' ? 'text-gray-800' : 'text-gray-400'
          }`}>
            Yape
          </span>
          {paymentMethod === 'yape' && (
            <div className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-fuchsia-600"></div>
          )}
        </button>
      </div>
      
      {/* Línea divisoria completa */}
      <div className="border-b border-gray-200"></div>
    </div>
  )
}

export default PaymentMethodSelector

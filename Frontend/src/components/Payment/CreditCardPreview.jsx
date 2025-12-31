import React from 'react'
import { CreditCard } from 'lucide-react'

/**
 * Detecta el tipo de tarjeta según el número
 */
const detectCardType = (number) => {
  const cleanNumber = number.replace(/\s/g, '')
  
  // Visa: empieza con 4
  if (/^4/.test(cleanNumber)) {
    return 'visa'
  }
  
  // Mastercard: empieza con 51-55 o 2221-2720
  if (/^5[1-5]/.test(cleanNumber) || /^2(22[1-9]|2[3-9]|[3-6]|7[01]|720)/.test(cleanNumber)) {
    return 'mastercard'
  }
  
  // American Express: empieza con 34 o 37
  if (/^3[47]/.test(cleanNumber)) {
    return 'amex'
  }
  
  return 'other'
}

/**
 * Formatea el número de tarjeta con espacios
 */
const formatCardNumber = (number, cardType) => {
  const cleaned = number.replace(/\s/g, '')
  
  // AMEX usa formato 4-6-5
  if (cardType === 'amex') {
    const match = cleaned.match(/(\d{0,4})(\d{0,6})(\d{0,5})/)
    return [match[1], match[2], match[3]].filter(Boolean).join(' ')
  }
  
  // Otros usan formato 4-4-4-4
  const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/)
  return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ')
}

/**
 * Vista previa animada de la tarjeta de crédito
 */
const CreditCardPreview = ({ cardNumber, cardName, expiryDate, cvv, isFlipped }) => {
  const cardType = detectCardType(cardNumber)
  const formattedNumber = formatCardNumber(cardNumber, cardType)
  
  // Colores según el tipo de tarjeta
  const cardStyles = {
    visa: 'bg-gradient-to-br from-blue-600 to-blue-800',
    mastercard: 'bg-gradient-to-br from-red-600 to-orange-600',
    amex: 'bg-gradient-to-br from-slate-400 via-gray-400 to-slate-500',
    other: 'bg-gradient-to-br from-purple-600 to-fuchsia-600'
  }
  
  // Logos de las tarjetas
  const CardLogo = () => {
    switch(cardType) {
      case 'visa':
        return (
          <img 
            src="/img/cart/visa.png" 
            alt="Visa" 
            className="h-10 w-auto object-contain"
          />
        )
      case 'mastercard':
        return (
          <img 
            src="/img/cart/mastercard.png" 
            alt="Mastercard" 
            className="h-16 w-auto object-contain"
          />
        )
      case 'amex':
        return (
          <img 
            src="/img/cart/amex.png" 
            alt="American Express" 
            className="h-16 w-auto object-contain"
          />
        )
      default:
        return (
          <CreditCard className="text-white opacity-70" size={40} />
        )
    }
  }
  
  return (
    <div className="mb-6 max-w-md mx-auto">
      {/* Contenedor con perspectiva 3D */}
      <div className="relative h-64" style={{ perspective: '1000px' }}>
        {/* Tarjeta con efecto flip */}
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* PARTE FRONTAL */}
          <div 
            className="absolute w-full h-full backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className={`${cardStyles[cardType]} rounded-xl p-6 shadow-xl h-full flex flex-col justify-between`}>
              {/* Chip y Logo */}
              <div className="flex justify-between items-center">
                {/* Chip */}
                <img 
                  src="/img/cart/chip.png" 
                  alt="Chip" 
                  className="h-28 w-auto object-contain"
                />
                
                {/* Logo de la tarjeta */}
                <div className="flex items-center justify-end">
                  <CardLogo />
                </div>
              </div>
              
              {/* Número de tarjeta */}
              <div>
                <div className="text-white text-2xl font-mono tracking-wider transition-all duration-300">
                  {formattedNumber || '•••• •••• •••• ••••'}
                </div>
              </div>
              
              {/* Nombre y Fecha */}
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="text-white text-xs opacity-70 mb-1">NOMBRE</div>
                  <div className="text-white text-base font-semibold uppercase transition-all duration-300">
                    {cardName || 'TU NOMBRE'}
                  </div>
                </div>
                
                <div>
                  <div className="text-white text-xs opacity-70 mb-1">VENCE</div>
                  <div className="text-white text-base font-mono transition-all duration-300">
                    {expiryDate || 'MM/AA'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PARTE TRASERA */}
          <div 
            className="absolute w-full h-full backface-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className={`${cardStyles[cardType]} rounded-xl shadow-xl h-full flex flex-col`}>
              {/* Banda magnética negra */}
              <div className="bg-black h-12 mt-6"></div>
              
              {/* Panel de firma y CVV */}
              <div className="flex-1 flex flex-col justify-center px-5">
                <div className="bg-white rounded h-10 flex items-center justify-end px-3 mb-2">
                  <span className="text-xs text-gray-400 mr-2">CVV</span>
                  <div className="bg-white border-2 border-gray-300 rounded px-2 py-1 min-w-[60px] text-center">
                    <span className="text-gray-800 font-mono text-lg tracking-widest">
                      {cvv || '•••'}
                    </span>
                  </div>
                </div>
                <p className="text-white text-[10px] opacity-70 text-right">
                  Código de seguridad
                </p>
              </div>
              
              {/* Logo pequeño en la parte trasera */}
              <div className="px-5 pb-5 flex justify-end">
                <div className="opacity-50">
                  <CardLogo />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreditCardPreview

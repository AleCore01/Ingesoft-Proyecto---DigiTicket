import React, { useState, useRef } from 'react'
import { HelpCircle } from 'lucide-react'

/**
 * Formulario de pago con Yape BCP
 */
const YapePaymentForm = ({ yapeData, setYapeData, total }) => {
  const [showHelp, setShowHelp] = useState(false)
  const inputRefs = useRef([])

  // Maneja el cambio en las cajas de código
  const handleTokenChange = (index, value) => {
    // Solo permite números
    const numValue = value.replace(/\D/g, '')
    
    if (numValue.length > 1) return // Solo 1 dígito por caja
    
    // Actualiza el token completo
    const tokenArray = yapeData.token.split('')
    tokenArray[index] = numValue
    const newToken = tokenArray.join('')
    
    setYapeData({ ...yapeData, token: newToken })
    
    // Mueve el foco a la siguiente caja si hay un número
    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Maneja el backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !yapeData.token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Maneja el pegado
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setYapeData({ ...yapeData, token: pastedData })
    
    // Mueve el foco a la última caja con valor
    const nextEmptyIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextEmptyIndex]?.focus()
  }

  return (
    <div className="space-y-4">
      {/* Botón de ayuda */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-semibold transition"
        >
          <HelpCircle size={18} />
          {showHelp ? "Ocultar ayuda" : "¿Cómo pagar con Yape?"}
        </button>
      </div>

      {/* Ayuda colapsable */}
      {showHelp && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 animate-fade-in">
          <p className="text-sm text-purple-800 font-semibold mb-2">
            Paga usando el código de aprobación disponible en Yape:
          </p>
          <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside ml-2">
            <li>Abre tu app de Yape</li>
            <li>Ve a la sección <span className="font-bold">"Código de aprobación"</span></li>
            <li>Ingresa el código de 6 dígitos (cambia cada minuto)</li>
          </ol>
        </div>
      )}

      {/* Logo de Yape */}
      <div className="flex justify-center mb-6">
        <img 
          src="/logo_yape.png" 
          alt="Yape BCP" 
          className="h-28"
        />
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
          Número de celular afiliado a Yape
        </label>
        <input
          type="tel"
          placeholder="999 999 999"
          maxLength="9"
          value={yapeData.phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            setYapeData({ ...yapeData, phoneNumber: value });
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-center"
        />
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
          Código de aprobación
        </label>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={yapeData.token[index] || ''}
              onChange={(e) => handleTokenChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Código de 6 dígitos de tu app Yape
        </p>
      </div>

    
    </div>
  )
}

export default YapePaymentForm

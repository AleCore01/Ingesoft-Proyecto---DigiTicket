import React from 'react'


const StepIndicator = ({ currentStep, steps = ['Carrito', 'Pago', 'Confirmación'] }) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep

        return (
          <React.Fragment key={stepNumber}>
            <div className="flex items-center gap-2">
              {/* Círculo del paso */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-fuchsia-600 text-white'
                      : isActive
                      ? 'bg-fuchsia-600 text-white shadow-lg scale-110'
                      : 'bg-gray-300 text-gray-600'
                  }
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>

              {/* Label del paso */}
              <span
                className={`
                  font-semibold text-sm hidden sm:inline
                  ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}
                `}
              >
                {label}
              </span>
            </div>

            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-1 w-12 sm:w-20 transition-all duration-300
                  ${isCompleted ? 'bg-fuchsia-600' : 'bg-gray-300'}
                `}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default StepIndicator

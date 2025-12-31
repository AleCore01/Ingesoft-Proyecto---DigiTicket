import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Componente de temporizador para mostrar el tiempo restante del hold
 * @param {Object} props
 * @param {string} props.expiresAt - ISO timestamp de expiración
 * @param {Function} props.onExpire - Callback cuando expira el timer
 */
const HoldTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, total: diff });
    };

    // Actualizar inmediatamente
    updateTimer();

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Reserva expirada</p>
          <p className="text-xs text-red-600 mt-0.5">
            Tu reserva ha expirado. Por favor, vuelve a agregar los tickets al carrito.
          </p>
        </div>
      </div>
    );
  }

  if (!timeLeft) return null;

  const { minutes, seconds, total } = timeLeft;
  const isLowTime = total < 60000; // Menos de 1 minuto
  const isCritical = total < 30000; // Menos de 30 segundos

  return (
    <div
      className={`
        border rounded-2xl p-4 flex items-center gap-3 transition-colors
        ${isCritical 
          ? 'bg-red-50 border-red-300' 
          : isLowTime 
            ? 'bg-amber-50 border-amber-300'
            : 'bg-blue-50 border-blue-200'
        }
      `}
    >
      <Clock
        className={`
          w-5 h-5 flex-shrink-0
          ${isCritical 
            ? 'text-red-600 animate-pulse' 
            : isLowTime 
              ? 'text-amber-600'
              : 'text-blue-600'
          }
        `}
      />
      <div className="flex-1">
        <p
          className={`
            text-sm font-semibold
            ${isCritical 
              ? 'text-red-800' 
              : isLowTime 
                ? 'text-amber-800'
                : 'text-blue-800'
            }
          `}
        >
          Tiempo restante de reserva
        </p>
        <p
          className={`
            text-xs mt-0.5
            ${isCritical 
              ? 'text-red-600' 
              : isLowTime 
                ? 'text-amber-600'
                : 'text-blue-600'
            }
          `}
        >
          Completa tu compra antes de que expire la reserva
        </p>
      </div>
      <div
        className={`
          text-right font-mono text-2xl font-bold
          ${isCritical 
            ? 'text-red-700' 
            : isLowTime 
              ? 'text-amber-700'
              : 'text-blue-700'
          }
        `}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

export default HoldTimer;

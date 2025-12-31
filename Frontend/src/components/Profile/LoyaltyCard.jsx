import React from 'react';
import { Award, TrendingUp, TrendingDown, Gift } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const LoyaltyCard = ({ points, history }) => {
  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('D MMM YYYY');
    } catch {
      return dateString;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'earned':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'redeemed':
        return <TrendingDown size={16} className="text-red-600" />;
      case 'bonus':
        return <Gift size={16} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'redeemed':
        return 'text-red-600';
      case 'bonus':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award size={32} />
          <div>
            <h3 className="text-lg font-bold">Programa de Lealtad</h3>
            <p className="text-sm opacity-90">DigiTicket Rewards</p>
          </div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-sm opacity-90 mb-1">Puntos disponibles</p>
          <p className="text-4xl font-bold">{points}</p>
          <p className="text-xs opacity-75 mt-2">
            Equivalente a S/. {(points * 0.10).toFixed(2)} en descuento
          </p>
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Historial de puntos</h4>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {history && history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-bold ${getTypeColor(item.type)}`}>
                    {item.points > 0 ? '+' : ''}{item.points}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: {item.balance}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm">No hay historial de puntos</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Gana 1 punto por cada S/. 10 en compras. Canjea tus puntos por descuentos.
        </p>
      </div>
    </div>
  );
};

export default LoyaltyCard;

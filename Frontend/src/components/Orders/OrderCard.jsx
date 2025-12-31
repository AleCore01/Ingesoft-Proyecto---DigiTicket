import React from 'react';
import { Calendar, MapPin, Package, CreditCard } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const OrderCard = ({ order, onClick }) => {
  const getStatusStyle = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      refunded: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
      refunded: 'Reembolsada'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('D [de] MMMM, YYYY');
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodLabel = (method) => {
    return method === 'card' ? 'Tarjeta' : 'Yape';
  };

  const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar size={14} />
              {formatDate(order.date)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {order.items.length > 0 && (
          <div className="mb-4">
            <div className="flex items-start gap-3">
              {order.items[0].eventImage && (
                <img
                  src={order.items[0].eventImage}
                  alt={order.items[0].eventTitle}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">
                  {order.items[0].eventTitle}
                </h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  {order.items[0].eventLocation}
                </p>
                {order.items.length > 1 && (
                  <p className="text-xs text-fuchsia-600 font-medium mt-1">
                    + {order.items.length - 1} evento(s) más
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Package size={16} />
              {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard size={16} />
              {getPaymentMethodLabel(order.paymentMethod)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-fuchsia-600">S/. {order.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

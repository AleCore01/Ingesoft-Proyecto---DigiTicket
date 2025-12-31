import React from 'react';
import { X, Calendar, MapPin, CreditCard, Package } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const OrderDetailModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('D [de] MMMM, YYYY [a las] HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatEventDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('dddd, D [de] MMMM, YYYY');
    } catch {
      return dateString;
    }
  };

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

  const getPaymentMethodLabel = (method) => {
    return method === 'card' ? 'Tarjeta de crédito/débito' : 'Yape';
  };

  const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle de Orden</h2>
            <p className="text-sm text-gray-500 mt-1">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de la orden</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-gray-900">{formatDate(order.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package size={16} className="text-gray-500" />
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard size={16} className="text-gray-500" />
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium text-gray-900">{getPaymentMethodLabel(order.paymentMethod)}</span>
                </div>
                {order.pointsUsed > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Puntos usados:</span>
                    <span className="font-medium text-green-600">{order.pointsUsed} puntos</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">S/. {order.subtotal.toFixed(2)}</span>
                </div>
                {order.pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento por puntos</span>
                    <span className="font-medium text-green-600">- S/. {order.pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-fuchsia-600">S/. {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tickets ({totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'})
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex gap-4">
                    {item.eventImage && (
                      <img
                        src={item.eventImage}
                        alt={item.eventTitle}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.eventTitle}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatEventDate(item.eventDate)}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin size={14} />
                          {item.eventLocation}
                        </p>
                        <p className="font-medium text-gray-900">
                          Zona: {item.zoneName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Precio unitario: S/. {item.unitPrice.toFixed(2)}</p>
                      <p className="text-base font-bold text-gray-900 mt-2">S/. {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-2xl transition shadow-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;

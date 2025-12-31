import React from 'react';
import { X, Calendar, MapPin, Ticket as TicketIcon, Download, QrCode } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const TicketDetailModal = ({ ticket, isOpen, onClose, onDownload }) => {
  if (!isOpen || !ticket) return null;

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('dddd, D [de] MMMM, YYYY');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      return dayjs(dateString).format('HH:mm');
    } catch {
      return ticket.eventTime || '';
    }
  };

  const formatPurchaseDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('D [de] MMMM, YYYY');
    } catch {
      return dateString;
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      used: 'bg-gray-100 text-gray-700 border-gray-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      expired: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      used: 'Usado',
      cancelled: 'Cancelado',
      expired: 'Expirado'
    };
    return labels[status] || status;
  };

  const handleDownload = () => {
    onDownload?.(ticket);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Detalle del Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {ticket.eventImage && (
            <div className="mb-6">
              <img
                src={ticket.eventImage}
                alt={ticket.eventTitle}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-2xl font-bold text-gray-900">{ticket.eventTitle}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{ticket.ticketCode}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Información del evento</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fecha y hora</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Calendar size={16} className="text-fuchsia-600" />
                    {formatDate(ticket.eventDate)} • {formatTime(ticket.eventDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-fuchsia-600" />
                    {ticket.eventLocation}
                  </p>
                  {ticket.eventAddress && (
                    <p className="text-xs text-gray-600 mt-1 ml-6">{ticket.eventAddress}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Información del ticket</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Zona</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <TicketIcon size={16} className="text-fuchsia-600" />
                    {ticket.zoneName}
                  </p>
                </div>
                {ticket.seatNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Asiento</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.seatNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Precio</p>
                  <p className="text-lg font-bold text-fuchsia-600">S/. {ticket.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Información de compra</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Orden</p>
                <p className="font-medium text-gray-900">{ticket.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha de compra</p>
                <p className="font-medium text-gray-900">{formatPurchaseDate(ticket.purchaseDate)}</p>
              </div>
            </div>
            {ticket.isUsed && ticket.usedDate && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-500">Usado el</p>
                <p className="font-medium text-gray-900">{formatPurchaseDate(ticket.usedDate)}</p>
              </div>
            )}
          </div>

          {ticket.status === 'active' && ticket.qrCode && (
            <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-2xl p-6 text-center border-2 border-fuchsia-200">
              <QrCode size={32} className="mx-auto text-fuchsia-600 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Código QR de acceso</h4>
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                  <QrCode size={120} className="text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Presenta este código en la entrada del evento
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-2xl transition"
            >
              Cerrar
            </button>
            {ticket.status === 'active' && (
              <button
                onClick={handleDownload}
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Download size={20} />
                Descargar PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;

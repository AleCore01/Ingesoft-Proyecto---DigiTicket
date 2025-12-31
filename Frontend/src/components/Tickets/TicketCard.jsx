import React from 'react';
import { Calendar, MapPin, Ticket as TicketIcon, Download } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const TicketCard = ({ ticket, onClick, onDownload }) => {
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

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('dddd, D [de] MMMM');
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

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    onDownload?.(ticket);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {ticket.eventImage && (
          <div className="md:w-48 h-48 md:h-auto">
            <img
              src={ticket.eventImage}
              alt={ticket.eventTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket.eventTitle}</h3>
              <p className="text-xs text-gray-500 font-mono">{ticket.ticketCode}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(ticket.status)}`}>
              {getStatusLabel(ticket.status)}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-fuchsia-600" />
              <span className="font-semibold">{formatDate(ticket.eventDate)}</span>
              <span className="text-gray-500">•</span>
              <span>{formatTime(ticket.eventDate)}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-fuchsia-600" />
              {ticket.eventLocation}
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <TicketIcon size={16} className="text-fuchsia-600" />
              <span className="font-semibold">{ticket.zoneName}</span>
              {ticket.seatNumber && (
                <>
                  <span className="text-gray-500">•</span>
                  <span>Asiento {ticket.seatNumber}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-sm">
              <p className="text-gray-500">Precio</p>
              <p className="text-lg font-bold text-fuchsia-600">S/. {ticket.price.toFixed(2)}</p>
            </div>
            {ticket.status === 'active' && (
              <button
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold rounded-2xl transition shadow-md"
              >
                <Download size={16} />
                Descargar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;

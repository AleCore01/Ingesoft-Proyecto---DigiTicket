import React from 'react';
import { X, Calendar, MapPin, Ticket as TicketIcon, Download } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const EventTicketsModal = ({ event, isOpen, onClose, onDownload, onTransfer }) => {
  if (!isOpen || !event) return null;

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
      return event.eventTime || '';
    }
  };

  const getTicketStatusStyle = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-300',
      used: 'bg-gray-100 text-gray-700 border-gray-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getTicketStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      used: 'Usado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const handleDownload = (ticket) => {
    onDownload?.(ticket);
  };

  const handleDownloadAll = () => {
    console.log('Downloading all tickets for event:', event.eventId);
  };

  const groupedByZone = event.tickets.reduce((acc, ticket) => {
    if (!acc[ticket.zoneName]) {
      acc[ticket.zoneName] = [];
    }
    acc[ticket.zoneName].push(ticket);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="relative">
          {event.eventImage && (
            <div className="h-48 overflow-hidden">
              <img
                src={event.eventImage}
                alt={event.eventTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{event.eventTitle}</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(event.eventDate)} • {formatTime(event.eventDate)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={16} />
                {event.eventLocation}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition shadow-lg"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Mis Tickets ({event.tickets.length})
            </h3>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold rounded-2xl transition shadow-md"
            >
              <Download size={18} />
              Descargar todos
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedByZone).map(([zoneName, tickets]) => (
              <div key={zoneName}>
                <div className="flex items-center gap-2 mb-3">
                  <TicketIcon size={20} className="text-fuchsia-600" />
                  <h4 className="text-lg font-bold text-gray-900">
                    Zona {zoneName} ({tickets.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 font-mono mb-1">
                            {ticket.ticketCode}
                          </p>
                          {ticket.seatNumber && (
                            <p className="text-sm font-semibold text-gray-900">
                              Asiento {ticket.seatNumber}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTicketStatusStyle(ticket.status)}`}>
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Precio</p>
                          <p className="text-lg font-bold text-fuchsia-600">
                            S/. {ticket.price?.toFixed(2) ?? '0.00'}
                          </p>
                        </div>
                        {ticket.status === 'active' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(ticket)}
                              className="flex items-center gap-1 px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold rounded-xl transition shadow-md"
                            >
                              <Download size={14} />
                              PDF
                            </button>
                            {onTransfer && (
                              <button
                                onClick={() => onTransfer(ticket)}
                                className="flex items-center gap-1 px-3 py-2 border border-fuchsia-600 text-fuchsia-700 hover:bg-fuchsia-50 text-sm font-semibold rounded-xl transition"
                              >
                                Transferir
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {ticket.isUsed && ticket.usedDate && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Usado el {dayjs(ticket.usedDate).locale('es').format('D [de] MMMM, YYYY [a las] HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {event.eventAddress && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Ubicación del evento</h4>
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                {event.eventAddress}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-2xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventTicketsModal;

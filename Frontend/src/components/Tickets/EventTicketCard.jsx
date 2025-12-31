import React from 'react';
import { Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const EventTicketCard = ({ event, ticketCount, onClick }) => {
  const getStatusColor = (status) => {
    const hasActive = event.tickets.some(t => t.status === 'active');
    const allUsed = event.tickets.every(t => t.status === 'used');
    
    if (hasActive) return 'border-green-500 bg-green-50';
    if (allUsed) return 'border-gray-400 bg-gray-50';
    return 'border-red-500 bg-red-50';
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
      return event.eventTime || '';
    }
  };

  const isPastEvent = () => {
    return dayjs(event.eventDate).isBefore(dayjs());
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 overflow-hidden ${getStatusColor(event.status)}`}
    >
      <div className="flex flex-col md:flex-row">
        {event.eventImage && (
          <div className="md:w-64 h-48 md:h-auto">
            <img
              src={event.eventImage}
              alt={event.eventTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.eventTitle}</h3>
            {isPastEvent() && (
              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                Evento finalizado
              </span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Calendar size={18} className="text-fuchsia-600" />
              <span className="font-semibold">{formatDate(event.eventDate)}</span>
              <span className="text-gray-500">•</span>
              <span>{formatTime(event.eventDate)}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <MapPin size={18} className="text-fuchsia-600" />
              {event.eventLocation}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <TicketIcon size={20} className="text-fuchsia-600" />
              <span className="text-lg font-bold text-gray-900">
                {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            <button className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold rounded-2xl transition shadow-md">
              Ver tickets
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {event.zones.map((zone, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
              >
                {zone.name} ({zone.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTicketCard;

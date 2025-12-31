import React from 'react';
import { Calendar, MapPin, Ticket, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

/**
 * Vista de lista compacta de evento con tickets (estilo Finder)
 */
const EventTicketListView = ({ event, ticketCount, onClick }) => {
  const eventDate = dayjs(event.eventDate);
  const isPastEvent = eventDate.isBefore(dayjs(), 'day');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Imagen miniatura */}
        <div className="flex-shrink-0">
          <img
            src={event.eventImage}
            alt={event.eventTitle}
            className="w-20 h-20 object-cover rounded-lg"
          />
        </div>

        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
            {event.eventTitle}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{eventDate.format('DD MMM YYYY')}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate">{event.eventLocation}</span>
            </div>
          </div>
        </div>

        {/* Badges de zonas */}
        <div className="flex-shrink-0 flex gap-2">
          {event.zones.slice(0, 3).map((zone, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-medium"
            >
              {zone.name}
            </div>
          ))}
          {event.zones.length > 3 && (
            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              +{event.zones.length - 3}
            </div>
          )}
        </div>

        {/* Total de tickets */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <Ticket size={16} className="text-gray-600" />
          <span className="text-sm font-bold text-gray-900">{ticketCount}</span>
        </div>

        {/* Indicador de estado y flecha */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPastEvent ? 'bg-gray-400' : 'bg-green-500'
            }`}
          />
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default EventTicketListView;

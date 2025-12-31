import React from 'react';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

/**
 * Vista de columnas compacta (estilo Finder columnas)
 */
const EventTicketColumnView = ({ event, ticketCount, onClick }) => {
  const eventDate = dayjs(event.eventDate);
  const isPastEvent = eventDate.isBefore(dayjs(), 'day');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 overflow-hidden"
    >
      {/* Imagen */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={event.eventImage}
          alt={event.eventTitle}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
            isPastEvent ? 'bg-gray-400' : 'bg-green-500'
          } ring-2 ring-white`}
        />
      </div>

      {/* Contenido compacto */}
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">
          {event.eventTitle}
        </h3>

        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{eventDate.format('DD/MM/YY')}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="truncate">{event.eventLocation}</span>
          </div>
        </div>

        {/* Zona principal */}
        {event.zones.length > 0 && (
          <div className="px-2 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-medium text-center truncate">
            {event.zones[0].name}
            {event.zones.length > 1 && ` +${event.zones.length - 1}`}
          </div>
        )}

        {/* Total de tickets */}
        <div className="flex items-center justify-center gap-1 pt-2 border-t border-gray-100">
          <Ticket size={14} className="text-fuchsia-600" />
          <span className="text-sm font-bold text-gray-900">{ticketCount} tickets</span>
        </div>
      </div>
    </div>
  );
};

export default EventTicketColumnView;

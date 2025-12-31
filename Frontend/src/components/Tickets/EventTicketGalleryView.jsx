import React from 'react';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

/**
 * Vista de galería grande con imagen destacada (Cover Flow style)
 */
const EventTicketGalleryView = ({ event, ticketCount, onClick }) => {
  const eventDate = dayjs(event.eventDate);
  const isPastEvent = eventDate.isBefore(dayjs(), 'day');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      {/* Imagen destacada grande */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={event.eventImage}
          alt={event.eventTitle}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Badge de estado */}
        <div className="absolute top-4 right-4">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isPastEvent
                ? 'bg-gray-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            {isPastEvent ? 'Finalizado' : 'Próximamente'}
          </div>
        </div>

        {/* Título sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
            {event.eventTitle}
          </h3>
        </div>
      </div>

      {/* Información detallada */}
      <div className="p-6 space-y-4">
        {/* Detalles del evento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Calendar size={18} className="text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Fecha</p>
              <p className="text-sm font-semibold text-gray-900">
                {eventDate.format('DD [de] MMMM, YYYY')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock size={18} className="text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Hora</p>
              <p className="text-sm font-semibold text-gray-900">{event.eventTime}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin size={18} className="text-fuchsia-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Ubicación</p>
            <p className="text-sm font-semibold text-gray-900">{event.eventLocation}</p>
            <p className="text-xs text-gray-600 mt-0.5">{event.eventAddress}</p>
          </div>
        </div>

        {/* Zonas */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Zonas disponibles</p>
          <div className="flex flex-wrap gap-2">
            {event.zones.map((zone, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-medium"
              >
                {zone.name} ({zone.count})
              </div>
            ))}
          </div>
        </div>

        {/* Total de tickets */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket size={20} className="text-fuchsia-600" />
            <span className="text-lg font-bold text-gray-900">{ticketCount} tickets</span>
          </div>
          <button className="px-4 py-2 bg-fuchsia-600 text-white rounded-2xl text-sm font-medium hover:bg-fuchsia-700 transition shadow-md">
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventTicketGalleryView;

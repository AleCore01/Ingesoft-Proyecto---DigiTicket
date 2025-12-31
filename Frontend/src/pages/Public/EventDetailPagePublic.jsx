"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopBarPublic from "../../components/Layout/TopBarPublic";
import { useEventsCache } from "../../context/EventsCache";
import { useEventLocation } from "../../hooks/useEventLocation";
import { useEventZones } from "../../hooks/useEventZones";
import { Calendar, Clock, MapPin, Home } from "lucide-react";
import { logger } from "../../utils/logger";

const EventDetailPagePublic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const { eventsCache, fetchEvents } = useEventsCache();

  const { getLocationName, getLocationAddress } = useEventLocation();
  const { zones, loading: zonesLoading } = useEventZones(event);

  // Buscar evento en caché primero (instantáneo)
  const cachedEvent = useMemo(() => {
    if (!eventsCache || !id) return null;
    const found = eventsCache.find(e => String(e.id) === String(id));
    if (found) {
      logger.log('[EventDetailPublic] Usando evento del caché:', found.title);
    }
    return found;
  }, [eventsCache, id]);

  // Cargar evento del caché o API
  useEffect(() => {
    const loadEvent = async () => {
      // Si está en caché, usarlo inmediatamente
      if (cachedEvent) {
        setEvent(cachedEvent);
        return;
      }

      // Si no hay caché, intentar cargar
      try {
        const events = await fetchEvents();
        const found = events.find(e => String(e.id) === String(id));
        if (found) {
          setEvent(found);
        }
      } catch (error) {
        logger.error('Error cargando evento:', error);
      }
    };

    loadEvent();
  }, [id, cachedEvent, fetchEvents]);

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBarPublic />
        <div className="flex justify-center items-center h-full text-gray-600">
          Cargando evento...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBarPublic />

      <main className="flex flex-col md:flex-row w-full px-8 py-10 gap-8">
        {/* IZQUIERDA */}
        <div className="flex-1">
          <img
            src={
              event.imageURL || 
              (event.imageBase64 ? `data:image/jpeg;base64,${event.imageBase64}` : "https://i.ibb.co/VqWc8jn/reggaeton6.jpg")
            }
            alt={event.title}
            className="w-full h-[300px] object-cover rounded-3xl mb-6"
            loading="lazy"
          />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Acerca de este evento
          </h2>

          <p className="text-gray-700 leading-relaxed mb-6">
            {event.description || "Descripción no disponible."}
          </p>

          <ul className="text-gray-700 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Calendar size={18} />
              <span>
                <strong>Fecha:</strong>{" "}
                {new Date(event.startsAt).toLocaleDateString("es-PE")}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Clock size={18} />
              <span>
                <strong>Hora:</strong>{" "}
                {new Date(event.startsAt).toLocaleTimeString("es-PE")}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={18} />
              <span>
                <strong>Ubicación:</strong> {getLocationName(event)}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Home size={18} />
              <span>
                <strong>Dirección:</strong> {getLocationAddress(event)}
              </span>
            </li>
          </ul>
        </div>

        {/* DERECHA CON PRECIOS */}
        <div className="w-full md:w-[40%] bg-white rounded-3xl p-8 shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Entradas disponibles
          </h2>

          {/* === TABLA DE PRECIOS === */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-gray-700 font-semibold">Zona</th>
                  <th className="pb-3 text-gray-700 font-semibold text-center">
                    Precio
                  </th>
                  <th className="pb-3 text-gray-700 font-semibold text-center">
                    Disponibilidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {zonesLoading ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      Cargando precios...
                    </td>
                  </tr>
                ) : zones && zones.length > 0 ? (
                  zones.map((zone) => (
                    <tr
                      key={zone.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 font-medium text-gray-800">
                        {zone.displayName ?? "—"}
                      </td>

                      <td className="py-3 text-center text-gray-700">
                        S/.{" "}
                        {Number(zone.price ?? 0).toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3 text-center">
                        <span
                          className={`font-semibold ${
                            (zone.seatsAvailable ?? 0) === 0
                              ? "text-red-600"
                              : (zone.seatsAvailable ?? 0) < 10
                              ? "text-amber-600"
                              : "text-green-600"
                          }`}
                        >
                          {zone.seatsAvailable ?? 0} disponibles
                        </span>
                        <span className="text-xs text-gray-500 block">
                          de {Number(zone.seatsQuota ?? 0)} totales
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No hay precios configurados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BOTÓN LOGIN */}
          <p className="text-gray-700 mb-6">
            Para comprar entradas debes iniciar sesión.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg font-bold px-10 py-3 rounded-2xl shadow-md transition"
          >
            INICIAR SESIÓN
          </button>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPagePublic;

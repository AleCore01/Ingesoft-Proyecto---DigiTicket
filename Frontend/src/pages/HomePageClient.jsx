"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import TopBarUser from "../components/Layout/TopBarUser";
import Footer from "../components/Layout/Footer";
import Pagination from "../components/Pagination/Pagination";
import { useEventsCache } from "../context/EventsCache";
import { useEventCategories } from "../hooks/useEventCategories";
import { useEventLocation } from "../hooks/useEventLocation";
import { usePageSlice } from "../hooks/usePageSlice";
import { useNavigate } from "react-router-dom";

const HomePageClient = () => {
  const navigate = useNavigate();

  // === Estados ===
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Locales dinámicos
  const [locales, setLocales] = useState([]);

  const [currentSlide, setCurrentSlide] = useState(0);

  // === Hooks personalizados ===
  const { categories, getCategoryName } = useEventCategories();
  const { getLocationName } = useEventLocation();
  const { page, setPage, pageItems, totalPages } = usePageSlice(events, 6);
  const { fetchEvents: fetchEventsCache, fetchLocales: fetchLocalesCache, eventsLoading } = useEventsCache();

  // === Imágenes por defecto ===
  const defaultImages = [
    "https://i.ibb.co/VqWc8jn/reggaeton6.jpg",
    "https://i.ibb.co/GvPSqXD/sebastian-llosa.jpg",
    "https://i.ibb.co/QCPZXZ8/coldplay.jpg",
    "https://i.ibb.co/px1HR9d/luisfonsi.jpg",
    "https://i.ibb.co/2jcZJKW/larumba.jpg",
    "https://i.ibb.co/kJsc1M9/hamlet.jpg",
  ];

  // === Cargar eventos con CACHÉ ===
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Usar caché global - solo hace API call la primera vez
      const cachedEvents = await fetchEventsCache();
      
      const withImages = cachedEvents.map((e, i) => ({
        ...e,
        image: e.imageURL || defaultImages[i % defaultImages.length],
      }));

      setAllEvents(withImages);
      setEvents(withImages);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  // === Cargar locales con CACHÉ ===
  const fetchLocales = async () => {
    try {
      const cachedLocales = await fetchLocalesCache();
      setLocales(cachedLocales);
    } catch (error) {
      logger.error("Error cargando locales:", error);
    }
  };

  // === Filtro local optimizado con useMemo ===
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Todas las condiciones en una sola pasada
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (selectedCategory) {
        const categoryName = getCategoryName(event);
        if (categoryName.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      
      if (selectedLocation) {
        const locationName = getLocationName(event);
        if (locationName.toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
      }
      
      if (selectedDate) {
        const eventDate = new Date(event.startsAt).toISOString().split("T")[0];
        if (eventDate !== selectedDate) return false;
      }
      
      return true;
    });
  }, [allEvents, searchTerm, selectedCategory, selectedLocation, selectedDate]);

  // === Efectos ===
  useEffect(() => {
    fetchEvents();
    fetchLocales();
  }, [fetchEventsCache, fetchLocalesCache]);

  // Actualizar events cuando cambien los filtros
  useEffect(() => {
    setEvents(filteredEvents);
    setPage(1);
  }, [filteredEvents]);

  // === Carrusel ===
  const featuredEvents = allEvents
    .slice()
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 4);

  useEffect(() => {
    if (featuredEvents.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length
    );

  // === Limpiar filtros ===
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSelectedDate("");
    setPage(1);
  }, []);

  // === Helpers ===
  const getCategoryColor = (category) => {
    const colors = {
      Conciertos: "bg-fuchsia-600",
      Teatro: "bg-red-600",
    };
    return colors[category] || "bg-gray-500";
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: "", time: "" };
    const date = new Date(dateTimeStr.replace(" ", "T"));
    const formattedDate = date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
    });
    const formattedTime = date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date: formattedDate, time: formattedTime };
  };

  const handleEventClick = useCallback((id) => {
    navigate(`/eventosCliente/${id}`);
    window.scrollTo(0, 0);
  }, [navigate]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      <TopBarUser />

      <main className="flex flex-col w-full px-8 py-6">
        {/* === CARRUSEL === */}
        <section className="relative w-full h-[420px] rounded-3xl overflow-hidden shadow-lg mb-14 group">
          {featuredEvents.map((event, index) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}

          {/* Botones laterales */}
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 z-40 bg-fuchsia-600 border-2 border-white hover:bg-fuchsia-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronLeft size={30} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-40 bg-fuchsia-600 border-2 border-white hover:bg-fuchsia-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronRight size={30} />
          </button>

          {/* Puntos indicadores */}
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-3 z-40">
            {featuredEvents.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-fuchsia-500 scale-125"
                    : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </section>

        {/* === EVENTOS === */}
        <section>
          <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-wide">
              EVENTOS DESTACADOS
            </h2>

            {/* === FILTROS === */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-700 items-center justify-end pr-6">
              {/* Nombre */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              {/* Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="">Categoría</option>
                {["Conciertos", "Teatro"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Local */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="">Local</option>
                {locales.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>

              {/* Fecha + limpiar */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
                {(searchTerm ||
                  selectedCategory ||
                  selectedLocation ||
                  selectedDate) && (
                  <button
                    onClick={clearFilters}
                    className="absolute -right-6 text-gray-400 hover:text-fuchsia-600 transition-colors"
                    title="Limpiar filtros"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* === LISTADO === */}
          {loading ? (
            <p className="text-gray-700 text-center">Cargando eventos...</p>
          ) : pageItems.length === 0 ? (
            <p className="text-gray-700 text-center">
              No se encontraron eventos
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {pageItems.map((event) => {
                  const { date, time } = formatDateTime(event.startsAt);
                  const categoryName = getCategoryName(event);
                  const locationName = getLocationName(event);

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                            {event.title}
                          </h3>
                          <span
                            className={`text-white text-[10px] font-medium px-2 py-[2px] rounded-full ${getCategoryColor(
                              categoryName
                            )}`}
                          >
                            {categoryName}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                          <Calendar size={14} /> {date} | {time}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <MapPin size={14} /> {locationName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center items-center mt-10">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePageClient;

/**
 * EventsCache Context
 * 
 * Caché global para eventos y locales para evitar múltiples llamadas API
 * Reduce drásticamente el tiempo de carga en navegación
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { eventsService } from "../services/eventsService";
import { localService } from "../services/localService";
import logger from "../utils/logger";

const EventsCacheContext = createContext();

export const useEventsCache = () => {
  const context = useContext(EventsCacheContext);
  if (!context) {
    throw new Error("useEventsCache must be used within EventsCacheProvider");
  }
  return context;
};

export const EventsCacheProvider = ({ children }) => {
  const [eventsCache, setEventsCache] = useState(null);
  const [localesCache, setLocalesCache] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [localesLoading, setLocalesLoading] = useState(false);

  /**
   * Fetch events con caché - solo llama API si no hay datos
   */
  const fetchEvents = useCallback(async (forceRefresh = false) => {
    // Si ya tenemos datos y no forzamos refresh, retornar caché
    if (eventsCache && !forceRefresh) {
      logger.log("[EventsCache] Using cached events:", eventsCache.length);
      return eventsCache;
    }

    // Si ya está cargando, esperar a que termine
    if (eventsLoading) {
      logger.log("[EventsCache] Already loading events, waiting...");
      return eventsCache || [];
    }

    try {
      setEventsLoading(true);
      logger.log("[EventsCache] Fetching events from API...");
      
      const response = await eventsService.getAll();
      // Manejar ambos formatos: response.data o response directamente
      const eventsData = response?.data ?? response ?? [];
      const eventsList = Array.isArray(eventsData) ? eventsData : [];
      
      // Convertir imágenes base64 a data URLs
      const eventsWithImages = eventsList.map((e) => ({
        ...e,
        imageURL: e.imageBase64
          ? `data:image/jpeg;base64,${e.imageBase64}`
          : null,
      }));

      setEventsCache(eventsWithImages);
      logger.log("[EventsCache] Events cached:", eventsWithImages.length);
      
      return eventsWithImages;
    } catch (error) {
      logger.error("[EventsCache] Error fetching events:", error);
      return [];
    } finally {
      setEventsLoading(false);
    }
  }, [eventsCache, eventsLoading]);

  /**
   * Fetch locales con caché - solo llama API si no hay datos
   */
  const fetchLocales = useCallback(async (forceRefresh = false) => {
    // Si ya tenemos datos y no forzamos refresh, retornar caché
    if (localesCache && !forceRefresh) {
      logger.log("[EventsCache] Using cached locales:", localesCache.length);
      return localesCache;
    }

    // Si ya está cargando, esperar
    if (localesLoading) {
      logger.log("[EventsCache] Already loading locales, waiting...");
      return localesCache || [];
    }

    try {
      setLocalesLoading(true);
      logger.log("[EventsCache] Fetching locales from API...");
      
      const response = await localService.getAll();
      // Manejar ambos formatos: response.data o response directamente
      const localesData = response?.data ?? response ?? [];
      const localesList = Array.isArray(localesData) ? localesData : [];
      
      setLocalesCache(localesList);
      logger.log("[EventsCache] Locales cached:", localesList.length);
      
      return localesData;
    } catch (error) {
      logger.error("[EventsCache] Error fetching locales:", error);
      return [];
    } finally {
      setLocalesLoading(false);
    }
  }, [localesCache, localesLoading]);

  /**
   * Invalidar caché cuando se crea/edita/elimina evento
   */
  const invalidateEventsCache = useCallback(() => {
    logger.log("[EventsCache] Invalidating events cache");
    setEventsCache(null);
  }, []);

  /**
   * Invalidar caché de locales
   */
  const invalidateLocalesCache = useCallback(() => {
    logger.log("[EventsCache] Invalidating locales cache");
    setLocalesCache(null);
  }, []);

  /**
   * Limpiar toda la caché
   */
  const clearCache = useCallback(() => {
    logger.log("[EventsCache] Clearing all cache");
    setEventsCache(null);
    setLocalesCache(null);
  }, []);

  const value = {
    // Métodos
    fetchEvents,
    fetchLocales,
    invalidateEventsCache,
    invalidateLocalesCache,
    clearCache,
    
    // Estados
    eventsCache,
    localesCache,
    eventsLoading,
    localesLoading,
    
    // Helper para saber si hay datos
    hasEventsCache: !!eventsCache,
    hasLocalesCache: !!localesCache,
  };

  return (
    <EventsCacheContext.Provider value={value}>
      {children}
    </EventsCacheContext.Provider>
  );
};

export default EventsCacheContext;

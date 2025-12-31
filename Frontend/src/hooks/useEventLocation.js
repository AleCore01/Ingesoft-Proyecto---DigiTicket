import React from "react";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { localService } from "../services/localService";

export const useEventLocation = () =>  {
  const [index, setIndex] = useState({}); // id -> { name, address, city, district, capacity, status }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(false); 

  const formatAddress = (locLike) => {
    if (!locLike) return "—";
    const address  = locLike.address ?? "";
    const district = locLike.district ?? "";
    const city     = locLike.city ?? "";
    const parts = [address, district, city].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  };

  useEffect(() => {
    let cancelled = false;
    
    // Timeout de seguridad: si después de 30s no hay respuesta, forzar fin de loading
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.error("⏱️ [useEventLocation] Timeout cargando locales (30s)");
        setError(new Error("El servidor tardó demasiado en responder"));
        setLoading(false);
      }
    }, 30000); // Aumentado a 30 segundos
    
    (async () => {
      try {
        console.log('🔄 [useEventLocation] Iniciando carga de locales...');
        setLoading(true);
        setError(null);
        
        const response = await localService.getAll();
        
        if (cancelled) {
          console.log('⚠️ [useEventLocation] Request cancelado - componente desmontado');
          return;
        }
        
        console.log('✅ [useEventLocation] Respuesta recibida:', response);
        
        const arr =
          (Array.isArray(response) && response) ||
          response?.data?.content ||
          response?.data ||
          response?.content ||
          [];

        console.log('📋 [useEventLocation] Datos parseados:', arr.length, 'locales');

        const idx = {};
        (Array.isArray(arr) ? arr : []).forEach((l) => {
          if (l?.id == null) return;
          idx[l.id] = {
            id: l.id,
            name: l.name ?? "—",
            address: formatAddress(l),
            city: l.city ?? null,
            district: l.district ?? null,
            capacity: l.capacity ?? null,
            status: l.status ?? null,
            raw: l,
          };
        });
        
        if (!cancelled) {
          console.log(`✨ [useEventLocation] Guardando ${Object.keys(idx).length} locales`);
          setIndex(idx);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('❌ [useEventLocation] Error:', e);
          setIndex({});
          setError(e);
          setLoading(false);
        }
      } finally {
        clearTimeout(timeout);
        console.log('🏁 [useEventLocation] Finalizando carga');
      }
    })();
    
    return () => { 
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const load = useCallback(async () => {
    console.log('🔄 [useEventLocation] Reload manual iniciado...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await localService.getAll();
      
      const arr =
        (Array.isArray(response) && response) ||
        response?.data?.content ||
        response?.data ||
        response?.content ||
        [];

      const idx = {};
      (Array.isArray(arr) ? arr : []).forEach((l) => {
        if (l?.id == null) return;
        idx[l.id] = {
          id: l.id,
          name: l.name ?? "—",
          address: formatAddress(l),
          city: l.city ?? null,
          district: l.district ?? null,
          capacity: l.capacity ?? null,
          status: l.status ?? null,
          raw: l,
        };
      });
      
      setIndex(idx);
      console.log(`✨ [useEventLocation] Reload completado: ${Object.keys(idx).length} locales`);
    } catch (e) {
      setIndex({});
      setError(e);
      console.error("❌ [useEventLocation] Error en reload:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- helpers ---

  // obtener solo locales activos
  const getActiveLocations = useMemo(() => {
    return Object.values(index).filter(location => 
      location.status === "ACTIVE"
    );
  }, [index]);

  const getEventLocationId = (eventLike) =>
    eventLike?.locationId ??
    eventLike?.location_id ??
    eventLike?.location?.id ??
    null;

  const getLocationName = (eventLike) => {
    if (eventLike?.location?.name) return String(eventLike.location.name);
    const id = getEventLocationId(eventLike);
    return (id != null && index[id]?.name) ? index[id].name : "—";
  };

  const getLocationAddress = (eventLike) => {
    const loc = eventLike?.location;
    if (loc && (loc.address || loc.district || loc.city)) {
      return formatAddress(loc);
    }
    const id = getEventLocationId(eventLike);
    return (id != null && index[id]?.address) ? index[id].address : "—";
  };

  const getLocationCapacity = (eventLike) => {
    const loc = eventLike?.location;
    if (loc && (loc.capacity != null)) return loc.capacity;
    const id = getEventLocationId(eventLike);
    return (id != null && index[id]?.capacity != null) ? index[id].capacity : null;
  };

  const getLocationStatus = (eventLike) => {
    const loc = eventLike?.location;
    if (loc?.status) return String(loc.status);
    const id = getEventLocationId(eventLike);
    return (id != null && index[id]?.status) ? String(index[id].status) : null;
  };

  const locationsById = useMemo(() => index, [index]);

  return {
    loading,
    error,
    reload: load,
    locationsById,
    activeLocations: getActiveLocations,
    getLocationName,
    getLocationAddress,
    getLocationCapacity,
    getLocationStatus,
  };
};
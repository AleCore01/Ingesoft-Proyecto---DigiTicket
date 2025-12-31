import React from "react";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { eventCategoryService } from "../services/eventCategoryService";

export function useEventCategories() {
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [list, setList]     = useState([]);
  const [byId, setById]     = useState({});
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Permitir que se ejecute en cada montaje (incluso con StrictMode)
    isMountedRef.current = true;
    const ac = new AbortController();  
    
    // Timeout de seguridad: si después de 10s no hay respuesta, forzar fin de loading
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        console.error("Timeout cargando categorías - forzando fin de loading");
        setError(new Error("Timeout: El servidor no responde"));
        setLoading(false);
      }
    }, 10000);
    
    (async () => {
      try {
        console.log('🔄 [useEventCategories] Iniciando carga de categorías...');
        setLoading(true);
        const res = await eventCategoryService.getAll();
        console.log('✅ [useEventCategories] Respuesta recibida:', res);
        
        // No verificar isMountedRef aquí - dejar que React maneje el setState
        
        const arr =
          (Array.isArray(res) && res) ||
          res?.data?.content ||
          res?.data ||
          res?.content ||
          [];

        console.log('📋 [useEventCategories] Datos parseados:', arr);

        // normaliza:
        const formatted = (Array.isArray(arr) ? arr : []).map(c => ({
          id: c?.id,
          name: c?.name ?? c?.nombre ?? `Categoría ${c?.id ?? ""}`.trim(),
        }));

        const map = {};
        formatted.forEach(c => {
          const key = c?.id != null ? String(c.id) : null;
          if (key) map[key] = c.name;
        });
        
        console.log(`✨ [useEventCategories] Guardando ${formatted.length} categorías`);
        setList(formatted);
        setById(map);
        setError(null);
      } catch (e) {
        console.error('❌ [useEventCategories] Error:', e);
        setError(e);
        setList([]);
        setById({});
      } finally {
        clearTimeout(timeout);
        console.log('🏁 [useEventCategories] Finalizando carga, loading=false');
        setLoading(false);
      }
    })();
    
    return () => { 
      isMountedRef.current = false;
      clearTimeout(timeout);
      ac.abort(); 
    };
  }, []);

  /* helpers */
  const getCategoryName = useCallback((eventLike) => {
    if (!eventLike) return "—";
    if (eventLike?.eventCategory?.name) return eventLike.eventCategory.name;

    const id =
      eventLike?.eventCategoryId ??
      eventLike?.eventCategory?.id ??
      eventLike?.categoryId ??
      eventLike?.category?.id ??
      null;

    const key = id != null ? String(id) : null;
    return (key && byId[key]) ? byId[key] : "Categoría no encontrada";
  }, [byId]);

  const selectOptions = useMemo(
    () => list.map(c => ({ value: c.id, label: c.name })),
    [list]
  );

  return { loading, error, categories: list, categoriesById: byId, selectOptions, getCategoryName };
}
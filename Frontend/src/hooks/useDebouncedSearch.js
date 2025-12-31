import { useEffect } from "react"; 

export function useDebouncedSearch({
  searchTerm,
  setLoading,
  onResult,
  searchService,
  buildParams,
  onEmpty,
  delay = 250,
  dependencies,
  runWhenEmpty = () => false,
  unwrap = (r) => r?.data ?? r ?? [],
}) {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const delayDebounce = setTimeout(() => {
      const runSearch = async () => {
        try {
          setLoading(true);

          const term = (searchTerm ?? "").trim();

          // Si no hay texto y NO queremos buscar sin texto → onEmpty
          if (!term && !runWhenEmpty()) {
            if (onEmpty) await onEmpty();
            return;
          }

          // buildParams incorpora filtros externos (estado, local, fechas…)
          const params = buildParams ? buildParams(term) : term;

          // Si buildParams devuelve null/undefined y no corresponde buscar, usa onEmpty
          if (params == null) {
            if (onEmpty) await onEmpty();
            return;
          }

          const res = await searchService(params, { signal });
          const list = unwrap(res);

          if (onResult) onResult(Array.isArray(list) ? list : []);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error en búsqueda:", err);
          }
        } finally {
          setLoading(false);
        }
      };

      runSearch();
    }, delay);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [searchTerm, ...dependencies]);
}
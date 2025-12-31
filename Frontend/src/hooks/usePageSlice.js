import { useMemo, useState, useEffect } from "react";

export function usePageSlice(items, pageSize = 8) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    const n = Array.isArray(items) ? items.length : 0;
    return Math.max(1, Math.ceil(n / pageSize));
  }, [items, pageSize]);

  const pageItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  // Si cambian los items (nueva búsqueda / recarga), vuelve a la página 1
  useEffect(() => {
    setPage(1);
  }, [items]);

  return { page, setPage, totalPages, pageItems };
}
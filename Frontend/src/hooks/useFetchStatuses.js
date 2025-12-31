import { useEffect, useRef, useState } from 'react';

/**
 * Hook to fetch and normalize status values.
 * @param {Function|undefined|null} fetchFn - Async function returning an array or an object with a `data` array.
 * @returns {{ statuses: Array<{id:string,name:string}>, loading: boolean }}
 */
export function useFetchStatuses(fetchFn) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      try {
        if (typeof fetchFn !== 'function') {
          // Nothing to fetch
          if (mountedRef.current) setLoading(false);
          return;
        }

        if (mountedRef.current) setLoading(true);

        const res = await fetchFn();

        // Determine array payload
        let arr = [];
        if (Array.isArray(res)) {
          arr = res;
        } else if (Array.isArray(res?.data)) {
          arr = res.data;
        } else if (Array.isArray(res?.statuses)) {
          arr = res.statuses;
        }

        // Normalize to { id, name }
        const normalized = arr
          .map((item) => {
            if (typeof item === 'string') {
              return { id: item, name: item };
            }
            if (item && typeof item === 'object') {
              const id = item.id ?? (typeof item.name === 'string' ? item.name : undefined);
              const name = item.name ?? (typeof item.id === 'string' ? item.id : String(item.id ?? ''));
              if (id != null && name != null) {
                return { id: String(id), name: String(name) };
              }
            }
            return null;
          })
          .filter(Boolean);

        if (mountedRef.current) setStatuses(normalized);
      } catch (err) {
        console.warn('useFetchStatuses: error fetching statuses', err);
        if (mountedRef.current) setStatuses([]);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    load();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchFn]);

  return { statuses, loading };
}

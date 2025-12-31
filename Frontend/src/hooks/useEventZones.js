import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { eventZoneService } from "../services/eventZoneService";
import { useEventLocation } from "./useEventLocation";

export const useEventZones = (event, draftLocationId = null) => {
  const eventId = event?.id ?? null;
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { getLocationCapacity } = useEventLocation();
  const lastFetchedEventId = useRef(null); 

  const localCapacity = useMemo(() => {
    const locId = draftLocationId ?? event?.locationId;
    if (!locId) return 0;
    const cap = getLocationCapacity({ locationId: locId });

    return Number.isFinite(Number(cap)) ? Number(cap) : 0;
  }, [event, draftLocationId, getLocationCapacity]);

  // ------------------- normalizar datos ------------------
  const normalize = useCallback((arr) => {
    return (arr || []).map((z) => ({
      id: z.id ?? null,
      displayName: (z.displayName ?? "").trim(),
      locationZone: z.locationZone ?? null,
      price: z.price === "" || z.price == null ? "" : Number(z.price),
      seatsQuota: z.seatsQuota === "" || z.seatsQuota == null ? "" : Number(z.seatsQuota),
      seatsSold: Number(z.seatsSold ?? 0),
      seatsAvailable: Number(z.seatsAvailable ?? 0),
      status: z.status ?? "ACTIVE",
      editing: false, // campo edición
      locationZoneId: z.locationZoneId ?? z.locationZone?.id ?? null,
      isNew: false
    }));
  }, []);

  const validateBeforeSave = useCallback(() => {
    const invalid = zones.some(z =>
      !String(z.displayName||"").trim() ||
      Number(z.price) < 0 || Number.isNaN(Number(z.price)) ||
      Number(z.seatsQuota) < 0 || Number.isNaN(Number(z.seatsQuota))
    );

    if (invalid) return { ok:false, message:"Nombre, precio ≥ 0 y capacidad ≥ 0 en todas las filas." };
    return { ok: true };
  }, [zones]);

  // ------------------- Load (event zone) ------------------
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (!eventId) {
        setZones([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (lastFetchedEventId.current === eventId) return;
      lastFetchedEventId.current = eventId;

      try {
        setLoading(true);
        const res = await eventZoneService.listByEvent(eventId, { signal: controller.signal });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setZones(normalize(list));
        setError(null);
      } catch (e) {
        if (e?.name !== "AbortError") setError(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [eventId, normalize]);

  // ------------------- Funciones para editar, agregar, actualizar, eliminar ------------------
  const toggleEditZone = useCallback((zoneOrId) => {
    const id = (typeof zoneOrId === "string" || typeof zoneOrId === "number")
      ? zoneOrId
      : zoneOrId?.id;

    if (!id) return; // nada que togglear si no hay id

    setZones(prev =>
      prev.map(z =>
        z.id === id
          ? { ...z, editing: !(z.editing ?? false) }
          : z
      )
    );
  }, []);

  const updateZoneField = useCallback((zoneId, field, value) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        let val = value;
        if (field === "seatsQuota" || field === "price") {
          val = (value === "" || value == null) ? "" : Number(value);
        }
        if (field === "displayName") val = String(value);
        return { ...z, [field]: val };
      })
    );
  }, []);

  const addNewZone = useCallback(() => {
    setZones(prev => [...prev, {
      id: null,                  
      displayName: "",
      price: 0,
      seatsQuota: 0,
      seatsSold: 0,
      seatsAvailable: 0,
      status: "ACTIVE",
      locationZoneId: null,
      editing: true,
      isNew: true
    }]);
    return null;
  }, []);

  const removeZone = useCallback((zoneId) => {
    const snapshot = zones;
    const target = snapshot?.[zoneId];
    if (!target) return;

    setZones((prev) => prev.filter((_, i) => i !== zoneId));

    try {
      if (target.id != null) {
        eventZoneService.delete(target.id);
      }
    } catch (e) {
      setZones(snapshot);
      throw e;
    }
 }, [zones]);

  const saveZones = useCallback(async ({ zones, eventId }) => {
    setSaving(true);
    try {
      if (!eventId) {
        return { ok: true };
      } 
      const ops = (zones || []).map(z => {
        const isCreate = z?.isNew === true || z?.id == null;
        const dtoBase = {
          eventId: Number(eventId),
          displayName: z.displayName ?? "",
          price: z.price != null ? Number(z.price) : null,
          seatsQuota: z.seatsQuota != null ? Number(z.seatsQuota) : null,
          seatsSold: z.seatsSold != null ? Number(z.seatsSold) : null,
          status: (z.status ?? "ACTIVE").toUpperCase(),
        };
        const dto = isCreate
          ? dtoBase
          : {
              ...dtoBase,
              ...(z?.locationZoneId != null || z?.locationZone?.id != null
                ? { locationZoneId: Number(z.locationZoneId ?? z.locationZone?.id) }
                : {}),
            };
        return isCreate
          ? eventZoneService.create(dto)
          : eventZoneService.update(z.id, dto);
      });
      await Promise.all(ops);
      return { ok: true };
    } finally {
      setSaving(false);
    }
  }, []);

  // Validación capacidad: suma de seatsQuota no debe superar localCapacity
  const totalCapacityZones = useMemo(() => {
    return zones.reduce((sum, z) => sum + (Number(z.seatsQuota) || 0), 0);
  }, [zones]);

  const isCapacityExceeded = totalCapacityZones > localCapacity;

  const totals = useMemo(() => {
    const totalSold = zones.reduce((s, z) => s + (Number(z.seatsSold) || 0), 0);
    const totalQuota = zones.reduce((s, z) => s + (Number(z.seatsQuota) || 0), 0);
    return { totalSold, totalQuota };
  }, [zones]);

  return {
    zones,
    loading,
    error,
    totals,
    localCapacity,
    isCapacityExceeded,
    totalCapacityZones,

    // Edición
    toggleEditZone,
    updateZoneField,
    addNewZone,
    removeZone,

    setZones,
    validateBeforeSave,
    saving,
    saveZones,
  };
};
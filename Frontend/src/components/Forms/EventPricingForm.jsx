import { Edit } from "lucide-react";
import React, { useMemo, useCallback, useEffect, useState } from "react";
import { eventZoneService } from "../../services/eventZoneService";

import ButtonGeneric from "../Buttons/ButtonGeneric";
import TicketPricesTable from "../TicketPricesTable";
import EditTicketPriceModal from "../Modal/EditTicketPriceModal";

export default function EventPricingForm({
  eventId,      
  mode = "create",    
  className = "",
  allowEditWithoutSave = false,
  draftLocationId = null,
  onSaved,    
  draftRows,     
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const isEditDisabled = !(eventId || allowEditWithoutSave);
  const [rowsShown, setRowsShown] = useState([]);

  const draftRowsStable = useMemo(
    () => (Array.isArray(draftRows) ? draftRows : []),
    [draftRows]
  );

  // --- Carga de zonas (solo lectura) ---
  const fetchZones = useCallback(async (signal) => {
    if (!eventId) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await eventZoneService.listByEvent(Number(eventId), { signal });
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.items) ? res.items
        : Array.isArray(res) ? res : [];
      setRows(list);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("Error al listar las zonas y precios.", e);
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchZones(controller.signal);
    return () => controller.abort();
  }, [fetchZones]);

  useEffect(() => {
    if (eventId) {
      setRowsShown(rows);
    } else {
      setRowsShown(draftRowsStable);
    }
  }, [eventId, rows, draftRowsStable]);

  const refreshReadOnly = useCallback(() => {
    if (!eventId) return;
    const controller = new AbortController();
    fetchZones(controller.signal);
    return () => controller.abort();
  }, [eventId, fetchZones]);

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => {
    setOpen(false);
    refreshReadOnly();                 
  };

  const handleSaveZones = async (zones) => {
    const list = Array.isArray(zones) ? zones : [];

    // Validación mínima
    const valid = list.filter(z =>
      String(z?.displayName ?? "").trim() !== "" &&
      Number(z?.seatsQuota ?? z?.capacity) > 0 &&
      Number(z?.price) >= 0
    );

    if (valid.length === 0) {
      alert("Debes registrar al menos una zona válida.");
      return { ok: false, reason: "no_zones" };
    }

    setRowsShown(valid);
    if (!eventId) {
      onSaved?.(valid);
      return { ok: true };
    }

    try {
      const ops = valid.map((z) => {
        const isPersisted = z?.id != null;
        const base = {
            eventId: Number(eventId),
            displayName: z.displayName ?? "",
            price: z.price != null ? Number(z.price) : null,
            seatsQuota: z.seatsQuota != null ? Number(z.seatsQuota) : null,
            seatsSold: z.seatsSold != null ? Number(z.seatsSold) : null,
            status: (z.status ?? "ACTIVE").toUpperCase(),
        };
        const dto = isPersisted
          ? {
              ...base,
              ...(z?.locationZoneId != null || z?.locationZone?.id != null
                  ? { locationZoneId: Number(z.locationZoneId ?? z.locationZone?.id) }
                  : {}),
            }
          : base;

        return isPersisted
          ? eventZoneService.update(z.id, dto)
          : eventZoneService.create(dto);
      });

      await Promise.all(ops);
      await fetchZones();// refrescar tabla luego de guardar
      return { ok: true };
        
    } catch (e) {
        console.error("Error al guardar zonas:", e);
        setError(e);
        return { ok:false, error:e }
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <p className="px-2 text-base font-bold">Zonas y precios</p>
        <ButtonGeneric
            type="button"    
            onClick={handleOpenModal}
            className="w-full sm:w-auto"
            variant="default"
            disabled={isEditDisabled}
            >
            <Edit size={18} /> Editar
        </ButtonGeneric>
      </div>

      <TicketPricesTable
          rows={rowsShown}
          loading={loading}
          error={error}
          readOnly={true}     
      />

      <EditTicketPriceModal
          open={open}
          onClose={handleCloseModal}
          onSaved={handleSaveZones}
          eventId={eventId}
          draftLocationId={draftLocationId}
          onMutated={refreshReadOnly} 
      />  
    </div>
  );
}
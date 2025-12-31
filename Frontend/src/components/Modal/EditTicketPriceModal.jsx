import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { useEventZones } from "../../hooks/useEventZones";

import ButtonGeneric from "../Buttons/ButtonGeneric";
import ModalWarning from "../Modal/ModalWarning";
import ModalCheck from "../Modal/ModalCheck";
import TicketPricesTable from "../TicketPricesTable";

const toNumber = (v) => (v == null || v === "" ? null : Number(v));

const isValidZone = (z) =>
  String(z?.displayName ?? "").trim() !== "" &&
  (toNumber(z?.seatsQuota ?? z?.capacity) ?? 0) > 0 &&
  (toNumber(z?.price) ?? 0) >= 0;

const EditTicketPriceModal = ({ open = false, onClose, onSaved, eventId: eventIdProp, draftLocationId = null, onMutated = () => {} }) => {
  const { id } = useParams(); // /eventos/editar/:id
  const computed = Number.isFinite(Number(eventIdProp)) && Number(eventIdProp) > 0 ? Number(eventIdProp) : Number(id);
  const eventId = Number.isFinite(computed) ? computed : 0;

  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [draftList, setDraftList] = useState([]);
  const originalIdsRef = useRef(new Set());

  const {
    zones,
    addNewZone,
    updateZoneField,
    removeZone,
    toggleEditZone,

    // métricas
    localCapacity,
    totalCapacityZones,
    isCapacityExceeded,

    validateBeforeSave,
    saving,
    saveZones,
  } = useEventZones({ id: eventId }, draftLocationId );

  const safeList = Array.isArray(zones) ? zones : [];

  useEffect(() => {
    if (!open) {
      setErrorMsg("");
      setConfirmOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const current = Array.isArray(zones) ? zones : [];
    setDraftList(current);
    originalIdsRef.current = new Set(current.filter(z => z?.id != null).map(z => z.id));
  }, [open, zones]);

  /* validacion */
  const hasAnyRow = useMemo(() => Array.isArray(draftList) && draftList.length > 0, [draftList]);
  const hasAnyValid = useMemo(() => hasAnyRow && draftList.some(isValidZone), [hasAnyRow, draftList]);

  // Validación de filas
  const hasRowErrors = useMemo(() => {
    return draftList.some((r) => {
      const zone = String(r?.displayName ?? "").trim();
      const priceEmpty = r?.price === "" || r?.price == null;
      const seatsEmpty = r?.seatsQuota === "" || r?.seatsQuota == null;
      const priceNum = Number(r?.price);
      const seatsNum = Number(r?.seatsQuota);

      return (
        !zone ||
        priceEmpty || Number.isNaN(priceNum) || priceNum < 0 ||
        seatsEmpty || Number.isNaN(seatsNum) || seatsNum < 0
      );
    });
  }, [draftList]);

  const handleOpenConfirm = () => {
    if (!hasAnyValid) { // exige al menos UNA zona válida
      setErrorMsg("Agrega al menos una zona válida (nombre, capacidad > 0 y precio ≥ 0).");
      return;
    }
    
    const validation = validateBeforeSave?.();
    if (validation && !validation.ok) {  // Si la validación del hook falla, muestra su mensaje
      setErrorMsg(validation.message || "Hay errores en las filas.");
      return;
    }

    if (hasRowErrors) { // Si hay filas incompletas o con errores
      setErrorMsg("Verifica que todas las zonas tengan nombre, precio ≥ 0 y capacidad ≥ 0.");
      return;
    }

    if (isCapacityExceeded) { // Si la capacidad total está excedida
      setErrorMsg("La suma de capacidades excede la capacidad total del local.");
      return;
    }

    setErrorMsg("");
    setConfirmOpen(true);
  };

  const handleConfirmSave = async (e) => {
    e?.preventDefault?.();
    setErrorMsg("");

    if (!hasAnyValid) {
      setErrorMsg("Agrega al menos una zona válida (nombre, capacidad > 0 y precio ≥ 0).");
      return;
    }

    try {                    
      const currentIds = new Set(draftList.filter(z => z?.id != null).map(z => z.id));
      const deletedPersistedIds = [...originalIdsRef.current].filter(id => !currentIds.has(id));
      if (deletedPersistedIds.length > 0) {
        await Promise.all(deletedPersistedIds.map(id => removeZone?.(id)));
      }
      const res = eventId
        ? await saveZones({ zones: draftList, eventId })
        : await onSaved?.(draftList);    
      if (res?.ok !== false) setModalOpen(true);         
    } catch (e) {
      setErrorMsg(e?.message ?? "Error al guardar"); 
    }
  };

  const handleSuccessClose = () => {
    setModalOpen(false);
    onClose?.();
  };

  const handleCancelNoSave = async () => {
    setErrorMsg("");
    setConfirmOpen(false);
    onClose?.();
  };

  const handleAdd = () => {
    const newId = addNewZone();
    toggleEditZone?.(newId); // activar edición inmediatamente
  };

  if (!open) return null;

  // Adaptadores índice -> id
  const idAt = (i) => draftList?.[i]?.id;
  const toggleEditByIndex = (i) => toggleEditZone?.(idAt(i));
  const updateByIndex     = (i, field, value) => updateZoneField?.(idAt(i), field, value);
  const removeByIndex     = (i) => removeZone?.(idAt(i));
  const removeZoneLocalByIndex = (i) => {
    setDraftList(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
       
        <div className="flex items-center justify-between p-5 pb-2">
          <h3 className="px-2 text-lg font-bold">Zonas y precios</h3>

          <ButtonGeneric
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="w-full sm:w-auto"
            variant="default"
          >
            + Agregar
          </ButtonGeneric>
        </div>

        {/* Aviso de capacidad */}
        {typeof localCapacity === "number" && (
          <div className="mx-7 mt-2 mb-0 text-sm text-black">
            Capacidad usada:{" "}
            <span className={isCapacityExceeded ? "text-red-500 font-semibold" : ""}>
              {totalCapacityZones}
            </span>{" "}
            / {localCapacity}
          </div>
        )}

        {/* Tabla editable */}
        <div className="px-6 pb-4 pt-2">
          <TicketPricesTable
            rows={draftList}
            readOnly={false}
            updateZoneField={updateByIndex}
            toggleEditZone={toggleEditByIndex}
            removeZone={removeZone}
            onMutated={onMutated} 
            removeZoneLocalByIndex={removeZoneLocalByIndex}
          />

          {/* render - verificar errores */}
          <div className="mt-3 px-1 min-h-[20px] text-[11px] text-red-600 font-semibold">
            {errorMsg && <div>{errorMsg}</div>}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end mt-4 px-6 pb-6">
          <ButtonGeneric
            type="button"    
            onClick={handleOpenConfirm}
            loading={saving}
            className="w-full sm:w-auto"
            variant="default"
            disabled={!hasAnyValid || saving}>
            Guardar
          </ButtonGeneric>

          <ButtonGeneric 
            type="button"    
            onClick={handleCancelNoSave} 
            className="w-full sm:w-auto" 
            variant="cancel">
            Cancelar
          </ButtonGeneric>
        </div>
      </div>

      <ModalWarning 
        isOpen={confirmOpen} 
        onClose={() => !saving && setConfirmOpen(false)}
        onConfirm={saving ? undefined : handleConfirmSave} />

      <ModalCheck 
        isOpen={modalOpen} 
        message="Cambios realizados exitosamente" 
        onClose={handleSuccessClose} />
    </div>
  );
};

export default EditTicketPriceModal;
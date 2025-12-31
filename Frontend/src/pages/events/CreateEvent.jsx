import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsService } from "../../services/eventsService";
import { useEventForm } from "../../hooks/useEventForm";
import { useEventCategories } from "../../hooks/useEventCategories";
import { useEventLocation } from "../../hooks/useEventLocation";
import { eventZoneService } from "../../services/eventZoneService";

import EventForm from "../../components/Forms/EventForm";
import EventPricingForm from "../../components/Forms/EventPricingForm";
import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";
import ModalInfo from "../../components/Modal/ModalInfo";
import DateBadge from "../../components/Badges/DateBadge";

const FALLBACK_STATUSES = [
  { id: "DRAFT", name: "Borrador" },
  { id: "PUBLISHED", name: "Publicado" },
];

const CreateEvent = () => {
  const navigate = useNavigate();

  const [warningOpen, setWarningOpen] = useState(false);
  const [newEventId, setNewEventId] = useState(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("Evento registrado exitosamente");
  const [modalRedirect, setModalRedirect] = useState(null);
  const [draftZones, setDraftZones] = useState([]);
  const hasDraftZones = Array.isArray(draftZones) && draftZones.length > 0; // bandera
  const fileInputRef = useRef(null);
  const fileZonesRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const { loading: catsLoading, error: catsError, selectOptions: categoryOptions } = useEventCategories();
  const { loading: locsLoading, error: locsError, locationsById, activeLocations } = useEventLocation();

  // Debug logs
  console.log('🔍 [CreateEvent] Estados:', {
    catsLoading,
    catsError,
    categoryOptionsLength: categoryOptions?.length,
    locsLoading,
    locsError,
    activeLocationsLength: activeLocations?.length
  });

  const {
    form,
    setField,
    setFieldTouched,
    touched,
    errors,
    saving,
    submit,
  } = useEventForm({
    service: eventsService,
    defaults: {               
      title: "",
      description: "",
      status: "DRAFT",
      startsAt: "",
      durationMin: "",
      eventCategoryId: "",
      locationId: "",
      salesStartAt: "",
    },
  });

  // Reglas de habilitación: todos los campos requeridos llenos y sin errores
  const requiredKeys = ["title","description","status","startsAt","durationMin","eventCategoryId","locationId","salesStartAt"];
  const requiredFilled = requiredKeys.every(k => String(form?.[k] ?? "").trim() !== "");
  const hasErrors = Object.keys(errors || {}).length > 0;
  const canEditPricing = requiredFilled && !hasErrors;

  // abrir confirmación solo si no hay errores
  const handleOpenSaveWarning = () => {
    ["title","description","status","startsAt","durationMin","eventCategoryId","locationId","salesStartAt"].forEach(setFieldTouched);
    
    if (Object.keys(errors).length > 0) return;

    if (!hasDraftZones) { // cortar flujo cuando no hay zonas
      alert("Debes registrar al menos una zona antes de guardar el evento.");
      return;
    }

    setWarningOpen(true);
  };

  // ------------------- Acciones -------------------
  const handleConfirmAction = async () => {
    if (!hasDraftZones) {
      setWarningOpen(false);
      alert("Debes registrar al menos una zona antes de guardar el evento.");
      return;
    }
    
    console.log('🚀 [CreateEvent] Iniciando submit del evento...');
    const res = await submit(); // create()

    console.log('📦 [CreateEvent] Respuesta de submit:', res);

    if (!res?.ok) {
      if (res?.reason === "validation") {
        console.error('❌ [CreateEvent] Errores de validación:', res.errors);
        setWarningOpen(false);
        return;
      }
      
      console.error('❌ [CreateEvent] Error al guardar evento:', res);
      alert("Ocurrió un error al guardar.");
      setWarningOpen(false);
      return;
    }

    // Extraer el evento guardado de la respuesta
    const savedEvent = res?.data;
    console.log('✅ [CreateEvent] Evento guardado:', savedEvent);
    
    const eventId = savedEvent?.id;
    console.log('🆔 [CreateEvent] EventId extraído:', eventId, 'tipo:', typeof eventId);

    setWarningOpen(false);

    if (!eventId) {
      console.warn("⚠️ [CreateEvent] Evento guardado pero sin id en la respuesta:", savedEvent);
      setModalMessage("Evento registrado exitosamente");
      setModalRedirect("/eventos");
      setCheckOpen(true);
      return;
    }

    // Si hay zonas pendientes -> guárdalas y luego modal check + redirect
    console.log('🎫 [CreateEvent] Zonas pendientes:', draftZones?.length);
    
    if (draftZones?.length) {
      try {
        const toNum = (v, def = 0) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : def;
        };
        // dedup por nombre (evita 409/500 por único)
        const seen = new Set();
        const zonesToCreate = (draftZones ?? [])
          .map(z => ({
            eventId: Number(eventId),
            displayName: String(z?.displayName ?? "").trim(),
            price: toNum(z?.price, 0),
            seatsQuota: toNum(z?.seatsQuota ?? z?.capacity, 0),
            seatsSold: toNum(z?.seatsSold, 0),
            status: String(z?.status ?? "ACTIVE").toUpperCase(),
          }))
          .filter(z => {
            if (!z.displayName) return false;
            const k = z.displayName.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });

        console.log('📋 [CreateEvent] Zonas a crear:', zonesToCreate);

        if (zonesToCreate.length) {
          const results = await Promise.allSettled(
            zonesToCreate.map(p => {
              console.log('➕ [CreateEvent] Creando zona:', p);
              return eventZoneService.create(p);
            })
          );
          
          console.log('📊 [CreateEvent] Resultados de creación de zonas:', results);
          
          const failed = results.filter(r => r.status === "rejected");
          if (failed.length) {
            console.error("❌ [ZONE CREATE FAILED]", failed);
            failed.forEach((f, i) => {
              console.error(`  Zona ${i + 1} falló:`, f.reason);
            });
            alert(`El evento se guardó, pero falló el guardado de ${failed.length} zona(s). Revisa la consola para más detalles.`);
          } else {
            console.log('✅ [CreateEvent] Todas las zonas creadas exitosamente');
          }
        }
      } catch (e) {
        console.error("❌ [CreateEvent] Error guardando zonas (error no controlado):", e);
        alert("El evento se guardó, pero falló el guardado de zonas. Revisa la consola para más detalles.");
      }
    }

    setModalMessage("Evento registrado exitosamente");
    setModalRedirect("/eventos");
    setCheckOpen(true);
  };

  const handleCancel = () => navigate("/eventos");

  // ------------- Carga Masiva (CSV) -------------
  const handleBulkClick = () => fileInputRef.current?.click();
  const handleBulkSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await eventsService.bulkImport(file);
      const created = res?.createdCount ?? res?.created ?? 0;
      const errors = res?.errors || [];
      setModalMessage(`Carga masiva completada. Creados: ${created}. Errores: ${errors.length}`);
      setModalRedirect("/eventos");
      setCheckOpen(true);
    } catch (err) {
      console.error("Bulk import eventos fallo", err);
      setModalMessage("Error en carga masiva de eventos. Revise el CSV.");
      setModalRedirect(null);
      setCheckOpen(true);
    } finally {
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBulkZonesClick = () => fileZonesRef.current?.click();
  const handleBulkZonesSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await eventZoneService.bulkImport(file);
      const created = res?.createdCount ?? res?.created ?? 0;
      const errors = res?.errors || [];
      setModalMessage(`Carga masiva de zonas completada. Creados: ${created}. Errores: ${errors.length}`);
      setModalRedirect(null);
      setCheckOpen(true);
    } catch (err) {
      console.error("Bulk import zonas fallo", err);
      setModalMessage("Error en carga masiva de zonas. Revise el CSV.");
      setModalRedirect(null);
      setCheckOpen(true);
    } finally {
      if (fileZonesRef.current) fileZonesRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />
      
      <div className="flex-1 flex-col min-w-0">
        <TopBar />
        
        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2"> Registrar evento</h1>
            <DateBadge />
          </div>

          <div className="rounded-xl bg-white border p-8 shadow-sm">
            {/* Hidden input for CSV upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleBulkSelected}
            />
            <input
              ref={fileZonesRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleBulkZonesSelected}
            />
            <EventForm
              form={form}
              setField={setField}
              setFieldTouched={setFieldTouched}
              touched={touched}
              errors={errors}
              categoryOptions={categoryOptions}
              catsLoading={catsLoading}
              catsError={catsError}
              locsLoading={locsLoading}
              locsError={locsError}
              locationOptions={activeLocations.map(l => ({ value: l.id, label: l.name }))}
              selectedLocation={locationsById?.[form.locationId] ?? null}
              statuses={FALLBACK_STATUSES}
              onSaveClick={handleOpenSaveWarning}
              onCancel={handleCancel}
              saving={saving}
            />

            <EventPricingForm
              eventId={null} // newEventId
              allowEditWithoutSave={canEditPricing}
              draftLocationId={form?.locationId || null}
              mode={"create"}
              onSaved={(zones) => setDraftZones(Array.isArray(zones) ? zones : [])}
            />
            
            {/* Descargas de templates */}
            <div className="flex justify-end gap-3 mb-4">
              <a href="/templates/events.csv" className="text-blue-600 hover:underline" download>Descargar template eventos</a>
              <a href="/templates/event_zones.csv" className="text-blue-600 hover:underline" download>Descargar template zonas</a>
              <button onClick={() => setHelpOpen(true)} className="text-blue-600 hover:underline">Ayuda CSV</button>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <ButtonGeneric
                  type="button"
                  onClick={handleBulkClick}
                  className="w-full sm:w-auto"
                  variant="secondary">
                  Carga masiva
              </ButtonGeneric>
              <ButtonGeneric
                  type="button"
                  onClick={handleBulkZonesClick}
                  className="w-full sm:w-auto"
                  variant="secondary">
                  Carga masiva zonas
              </ButtonGeneric>
              <ButtonGeneric
                  type="button"  
                  onClick={handleOpenSaveWarning}
                  loading={saving}
                  disabled={saving}
                  className="w-full sm:w-auto"
                  variant="default">
                  Guardar
              </ButtonGeneric>

              <ButtonGeneric
                  type="button"  
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                  variant="cancel">
                  Cancelar
              </ButtonGeneric>
            </div>
          </div>   
        </div>
      </div>

      <ModalWarning
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmAction}
      />

      <ModalCheck
        isOpen={checkOpen}
        message={modalMessage}
        autoCloseMs={2000}
        onClose={() => {
          setCheckOpen(false);
          if (modalRedirect) {
            const to = modalRedirect; // captura
            setModalRedirect(null);
            navigate(to);
          }
        }}
      />

      <ModalInfo isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Guía de Carga Masiva (Eventos y Zonas)">
        <div>
          <p className="font-semibold">events.csv</p>
          <p>Columnas: <code>title,description,startsAt,salesStartAt,durationMin,locationId,eventCategoryId,administratorId,status,imageUrl,imageBase64</code></p>
          <ul className="list-disc ml-5">
            <li>Fechas: ISO (2025-12-24T20:00:00) o yyyy-MM-dd HH:mm</li>
            <li>status opcional: DRAFT, PUBLISHED, CANCELED, FINISHED</li>
            <li>Imagen: use <code>imageUrl</code> (recomendado) o <code>imageBase64</code></li>
          </ul>
        </div>
        <div className="pt-3">
          <p className="font-semibold">event_zones.csv</p>
          <p>Columnas: <code>eventId,displayName,price,seatsQuota,seatsSold,status</code></p>
          <ul className="list-disc ml-5">
            <li><code>status</code> opcional (por defecto ACTIVE)</li>
            <li>Se crea automáticamente la <code>LocationZone</code> ligada al local del evento</li>
          </ul>
        </div>
      </ModalInfo>
    </div>
  );
};

export default CreateEvent;
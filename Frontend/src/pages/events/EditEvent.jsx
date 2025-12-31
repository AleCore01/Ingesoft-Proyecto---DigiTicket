import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { eventsService } from "../../services/eventsService";
import { useEventForm } from "../../hooks/useEventForm";
import { useEventZones } from "../../hooks/useEventZones";
import { useEventCategories } from "../../hooks/useEventCategories";
import { useEventLocation } from "../../hooks/useEventLocation";

import EventForm from "../../components/Forms/EventForm";
import EventPricingForm from "../../components/Forms/EventPricingForm";
import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import ContentPreLoader from "../../components/Layout/ContentPreloader";

const FALLBACK_STATUSES = [
  { id: "DRAFT", name: "Borrador" },
  { id: "PUBLISHED", name: "Publicado" },
  { id: "CANCELED", name: "Cancelado" },
  { id: "FINISHED", name: "Finalizado" },
];

function EditEvent() {
  const { id } = useParams(); 
  const eventId = Number(id) || 0;        
  const navigate = useNavigate();
  const location = useLocation();
  const eventFromState = location.state?.event;

  const {
    mode,                 // 'edit' 
    form,                 // datos del evento
    setField,             // setter por campo
    setFieldTouched,      // marcar "touched"
    touched,
    errors,
    loading,              // cargando detalle del evento
    saving,               // guardando (submit en progreso)
    submit,               // valida y hace update(id)
  } = useEventForm({
    id,
    service: eventsService,
    initialEvent: eventFromState,
    onSaved: () => {
      setWarningOpen(false);
      setModalOpen(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate("/eventos");
      }, 2000);
    },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const { zones, totals, loading: zonesLoading, error: zonesError } = useEventZones({ id: eventId }, form?.locationId ?? null);
  const { loading: catsLoading, selectOptions: categoryOptions } = useEventCategories();
  const { loading: locsLoading, locationsById } = useEventLocation();

  if (!Number.isFinite(eventId) || eventId <= 0) {
    navigate("/eventos");
    return null;
  }

  // ------------------- Acciones ------------------
  const handleOpenSaveWarning = (eve) => {
    eve?.preventDefault?.();
    ["title","description","status","startsAt","capacity","durationMin","eventCategoryId","locationId","salesStartAt"].forEach(setFieldTouched);
    
    if (Object.keys(errors).length > 0) return;
    setWarningOpen(true);
  };

  const handleCloseWarning = () => setWarningOpen(false);
  const handleCancel = () => navigate("/eventos");

  const handleConfirmSave = async () => {
    const res = await submit();
    if (!res?.ok) {
      if (res?.reason === "validation") {
        setWarningOpen(false);
        return;
      }
      alert("Ocurrió un error al guardar.");
      setWarningOpen(false);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <SideBarMenu />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-8 bg-backgroundGeneral flex items-center justify-center">
            <ContentPreLoader loading={loading} text="Cargando detalle del evento..." />
          </div>
        </div>
      </div>
    );
  }
  // si no encuentra id, redireccionar a evento

  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />
    
      <div className="flex-1 flex-col min-w-0">
        <TopBar />
        
        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2"> Modificar evento</h1>
            <DateBadge />
          </div>

          {/* Formulario */}
          <div className="rounded-xl shadow-sm bg-white border p-8">
            <EventForm
              form={form}
              setField={setField}
              setFieldTouched={setFieldTouched}
              touched={touched}
              errors={errors}
              categoryOptions={categoryOptions}
              catsLoading={catsLoading}
              locsLoading={locsLoading}
              locationOptions={Object.values(locationsById||{}).map(l=>({value:l.id,label:l.name}))}
              selectedLocation={locationsById?.[form.locationId] ?? null}
              statuses={FALLBACK_STATUSES}
              onSaveClick={handleOpenSaveWarning}
              onCancel={handleCancel}
              saving={saving}
              mode={mode}
            />

            <EventPricingForm
              eventId={eventId}           
              mode="edit"
              draftLocationId={form?.locationId ?? null}
              allowEditWithoutSave={false}   
            />

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
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
        onClose={handleCloseWarning} 
        onConfirm={handleConfirmSave}/>                 

      <ModalCheck
        isOpen={modalOpen}
        message="Cambios realizados exitosamente"
        onClose={() => setModalOpen(false)}/>
    </div>
  );
};

export default EditEvent;
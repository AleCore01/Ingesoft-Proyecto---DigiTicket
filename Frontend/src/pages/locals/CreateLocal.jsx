import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { localService } from "../../services/localService";
import { useLocalForm } from "../../hooks/useLocalForm";

import LocalForm from "../../components/Forms/LocalForm";
import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import ModalInfo from "../../components/Modal/ModalInfo";

const FALLBACK_STATUSES = [
  { id: "ACTIVE", name: "Activo" },
  { id: "INACTIVE", name: "Inactivo" },
];

function CreateLocal() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("Local registrado exitosamente");
  const [modalRedirect, setModalRedirect] = useState(null);

  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const fetchedOnce = useRef(false);
  const fileInputRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    formData,
    setField,
    setFieldTouched,
    touched,
    errors,
    saving,
    submit,
  } = useLocalForm({
    service: localService,
    defaults: {               
      name: "",
      address: "",
      city: "",
      district: "",
      capacity: "",
      status: "ACTIVE",
      contactEmail: "",
    },
    onSaved: () =>{
      setWarningOpen(false);
      setModalMessage("Local registrado exitosamente");
      setModalRedirect("/locales");
      setModalOpen(true);
    }
  });

  // Cargar ciudades
  useEffect(() => {
    if (fetchedOnce.current) return;      
    fetchedOnce.current = true;
    
    const ac = new AbortController();
    
    (async () => {
      setCitiesLoading(true);
      try {    
        const res = await localService.city.getAll({ signal: ac.signal });

        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.cities)
          ? res.cities
          : [];

        setCityOptions(list);  
      } catch (e) {
        console.error("Error al cargar ciudades", e);
        setCityOptions([]);
      } finally {
        setCitiesLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const handleCityChange = async (cityId) => {
    if (!cityId) {
      setDistrictOptions([]);
      setField("districtId")("");
      return;
    }
    setField("cityId")(String(cityId));
    setDistrictsLoading(true);
    try {
      const res = await localService.district.getByCity(cityId);

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.districts)
        ? res.districts
        : [];
      
      setDistrictOptions(list);
    } catch (e) {
      console.error("Error al cargar distritos", e);
      setDistrictOptions([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // abrir confirmación solo si no hay errores
  const handleOpenSaveWarning = () => {
    ["name","address","cityId","districtId","capacity","status","contactEmail"].forEach(setFieldTouched);
    
    if (Object.keys(errors).length > 0) return;
    setWarningOpen(true);
  };

  // ------------------- Acciones ------------------
  const handleConfirmAction = async () => {
    const result = await submit((current) => {
      const cityId = current.cityId ? String(current.cityId) : "";
      const districtId = current.districtId ? String(current.districtId) : "";
      const cityName = cityOptions.find(c => String(c.id) === String(cityId))?.name ?? "";
      const districtName = districtOptions.find(d => String(d.id) === String(districtId))?.name ?? "";

      return {
        name: String(current.name || "").trim(),
        address: String(current.address || "").trim(),
        capacity: Number(current.capacity),
        status: "ACTIVE",
        contactEmail: String(current.contactEmail || "").trim() || null,
        // Backend requiere IDs
        cityId,
        districtId,
        // Opcional: enviar nombres si el backend los ignora/usa
        city: cityName,
        district: districtName,
      };
    });
    if (result?.ok === true) return;  // onSaved se encargará de modal + redirect
   setWarningOpen(false);
  };

  const handleCancel = () => navigate("/locales");

  // ------------- Carga Masiva (CSV) -------------
  const handleBulkClick = () => fileInputRef.current?.click();
  const handleBulkSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await localService.bulkImport(file);
      const created = res?.createdCount ?? res?.created ?? 0;
      const errors = res?.errors || [];
      setModalMessage(`Carga masiva completada. Creados: ${created}. Errores: ${errors.length}`);
      setModalRedirect("/locales");
      setModalOpen(true);
    } catch (err) {
      console.error("Bulk import locales fallo", err);
      setModalMessage("Error en carga masiva de locales. Revise el CSV.");
      setModalRedirect(null);
      setModalOpen(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />
      
      <div className="flex-1 flex-col min-w-0">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2">Registrar Local</h1>
            <DateBadge />
          </div>
          
          <div className="rounded-xl bg-white p-8 shadow-sm">
            {/* Descarga de template */}
            <div className="flex justify-end items-center gap-3 mb-4">
              <a href="/templates/locals.csv" className="text-blue-600 hover:underline" download>
                Descargar template locales
              </a>
              <button onClick={() => setHelpOpen(true)} className="text-blue-600 hover:underline">Ayuda CSV</button>
            </div>
            {/* Hidden input for CSV upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleBulkSelected}
            />
            <LocalForm
              formData={formData}
              setField={setField}
              setFieldTouched={setFieldTouched}
              touched={touched}
              errors={errors}
              statuses={FALLBACK_STATUSES}
              cityOptions={cityOptions}
              districtOptions={districtOptions}
              citiesLoading={citiesLoading}
              districtsLoading={districtsLoading}
              lockStatus     
              onCityChange={handleCityChange}
              onSaveClick={handleOpenSaveWarning}
              onCancel={handleCancel}
              saving={saving}
            />
          </div>
          
          {/* Botonera inferior */}
          <div className="flex justify-end gap-3 mt-6">
            <ButtonGeneric
              type="button"
              onClick={handleBulkClick}
              className="w-full sm:w-auto"
              variant="secondary"
            >
              Carga masiva
            </ButtonGeneric>
          </div>
        </div>  
      </div>

      <ModalWarning
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmAction}
      />

      <ModalCheck
        isOpen={modalOpen}
        message={modalMessage}
        autoCloseMs={2000}
        onClose={() => {
          setModalOpen(false);
          if (modalRedirect) {
            const to = modalRedirect;
            setModalRedirect(null);
            navigate(to);
          }
        }}
      />

      <ModalInfo isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Guía de Carga Masiva (Locales)">
        <div>
          <p>Archivo: <code>locals.csv</code></p>
          <p>Columnas: <code>name,address,city,district,capacity,contactEmail</code></p>
          <ul className="list-disc ml-5">
            <li><code>contactEmail</code> opcional</li>
            <li><code>capacity</code> numérico</li>
          </ul>
        </div>
      </ModalInfo>
    </div>
  );
}

export default CreateLocal;
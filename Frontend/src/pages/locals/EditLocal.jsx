import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { localService } from "../../services/localService";
import { useLocalForm } from "../../hooks/useLocalForm";

import LocalForm from "../../components/Forms/LocalForm";
import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";
import ContentPreLoader from "../../components/Layout/ContentPreloader";

const FALLBACK_STATUSES = [
  { id: "ACTIVE", name: "Activo" },
  { id: "INACTIVE", name: "Inactivo" },
];

const toArray = (res, key) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) 
                     ? res.data : Array.isArray(res?.[key]) 
                     ? res[key] : [];

function EditLocal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const localFromState = location.state?.local;

  const {
    mode,                    
    formData,
    setField,
    setFieldTouched,
    touched,
    errors,
    loading,
    saving,
    submit,                  // valida y hace update(id) o create()
  } = useLocalForm({
    id,
    service: localService,
    initialLocal: localFromState,        
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [seededIds, setSeededIds] = useState(false);

  const norm = (v) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

  // Cargar ciudades 
  useEffect(() => {
    if (!formData) return;

    (async () => {
      setCitiesLoading(true);

      try {
        const resCities = await localService.city.getAll();
        const citiesArray = toArray(resCities, "cities");
        setCityOptions(citiesArray);

        // Si ya tenemos un cityId, cargar los distritos correspondientes
        if (formData.cityId) {
          setDistrictsLoading(true);
          try {
            const resDistricts = await localService.district.getByCity(formData.cityId);
            setDistrictOptions(toArray(resDistricts, "districts"));
          } catch (e) {
            console.error("Error al cargar distritos", e);
            setDistrictOptions([]);
          } finally {
            setDistrictsLoading(false);
          }
        }
      } catch (e) {
        console.error("Error al cargar ciudades o distritos", e);
        setCityOptions([]);
        setDistrictOptions([]);
      } finally {
        setCitiesLoading(false);
        setDistrictsLoading(false);
      }
    })();
  }, [formData?.cityId]);

  useEffect(() => {
    if (seededIds) return;
    if (!formData) return;

    let cId = localFromState?.cityId ?? formData?.cityId;
    let dId = localFromState?.districtId ?? formData?.districtId;

    if (!cId && formData.city && cityOptions.length > 0) {
      const matchCity = cityOptions.find(
        (c) => norm(c.name) === norm(formData.city)
      );
      if (matchCity) {
        cId = matchCity.id;
        setField("cityId")(String(cId));
      
        // Cargar distritos para esta ciudad
        (async () => {
          setDistrictsLoading(true);
          try {
            const resDistricts = await localService.district.getByCity(cId);
            const districtsArray = toArray(resDistricts, "districts");
            setDistrictOptions(districtsArray);
            
            // buscar el distrito por nombre
            if (!dId && formData.district && districtsArray.length > 0) {
              const matchDistrict = districtsArray.find(
                (d) => norm(d.name) === norm(formData.district)
              );
              if (matchDistrict) {
                dId = matchDistrict.id;
                setField("districtId")(String(dId));
              }
            }
          } catch (e) {
            console.error("Error al cargar distritos para seededIds", e);
          } finally {
            setDistrictsLoading(false);
            setSeededIds(true);
          }
        })();
        
        return;
      }
    }

    // Si ya tenemos ambos IDs, establecerlos
    if (cId) setField("cityId")(String(cId));
    if (dId) setField("districtId")(String(dId));

    if (cId || dId) setSeededIds(true);
  }, [seededIds, formData, localFromState, cityOptions, districtOptions, setField]);

  const handleCityChange = useCallback((cityId) => {
    setField("cityId")(String(cityId));
    setField("districtId")("");
  },
    [setField]
  );

  // ------------------- Acciones ------------------
  const handleOpenSaveWarning = useCallback((loc) => {
    loc?.preventDefault?.();
    setWarningOpen(true);
  }, []);

  const handleCloseWarning = () => setWarningOpen(false);

  // Confirmar en modal => guarda + navega a /locales
  const handleConfirmSave = useCallback(async () => {
    try {
      const result = await submit((current) => {
        const cityName =
          current.city?.name ||
          cityOptions.find((c) => String(c.id) === String(current.cityId))?.name ||
          current.city || "";

        const districtName =
          current.district?.name ||
          districtOptions.find((d) => String(d.id) === String(current.districtId))?.name ||
          current.district || "";

        return {
          name: String(current.name || "").trim(),
          address: String(current.address || "").trim(),
          city: cityName,
          district: districtName,
          capacity: Number(current.capacity),
          contactEmail: String(current.contactEmail || "").trim() || null,
          status: mode === "create" ? "ACTIVE" : String(current.status || "").trim() || "ACTIVE",
        };
      });

      if (result?.ok === true) {
        setWarningOpen(false);
        setModalOpen(true);
        setTimeout(() => {
          setModalOpen(false);
          navigate("/locales");
        }, 1400); // o el tiempo que prefieras
      } else {
        // validación fallida u otro caso: cierra el warning y deja el form para corregir
        setWarningOpen(false);
      }
    } catch (err) {
      console.error("Fallo al guardar:", err);
      setWarningOpen(false);
      // opcional: alert o toast
    }
  }, [submit, cityOptions, districtOptions, mode, navigate]);

const handleCancel = () => navigate("/locales");

  if (loading) {
    return (
      <div className="flex h-screen">
        <SideBarMenu />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-8 bg-backgroundGeneral flex items-center justify-center">
            <ContentPreLoader loading={loading} text="Cargando detalle del local..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 flex-col min-w-0">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2">Modificar local</h1>
            <DateBadge />
          </div>
          
          {/* Formulario */}
          <div className="rounded-xl shadow-sm bg-white p-8">
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
              onCityChange={handleCityChange}
              onSaveClick={handleOpenSaveWarning}
              onCancel={handleCancel}
              saving={saving}
            />
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
}

export default EditLocal;
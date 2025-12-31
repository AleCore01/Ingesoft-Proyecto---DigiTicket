import { Edit } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { localService } from "../../services/localService";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from "../../components/Badges/DateBadge";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import EventStatusBadge from "../../components/Badges/EventStatusBadge";
import ContentPreLoader from "../../components/Layout/ContentPreloader";
import ModalWarning from "../../components/Modal/ModalWarning";

function LocalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // obtener id

  const [localData, setLocalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningOpen, setWarningOpen] = useState(false);

  const [formState, setFormState] = useState({ isLoading: false });

  // Cargar datos del local
  useEffect(() => {
    let mounted = true;

    const fetchLocal = async () => {
      try {
        setLoading(true);
        const resp = await localService.getById(id);
        const data = resp?.data ?? resp;

        if (!mounted) return;
        if (!data || !data.id) { // si no encontro local
          console.error("Local no encontrado");
          setLocalData(null);
          return;
        }

        setLocalData(data);
        
      } catch (error) {
        console.error("Error cargando detalle del local:", error);
        setLocalData(null);
      } finally {
        mounted && setLoading(false);
      }
    };

    if (id) {
      fetchLocal();
    } else {
      navigate("/locales");
    }

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const handleEdit = () => setWarningOpen(true);
  
  const handleConfirmEdit = () => {
      setWarningOpen(false);
      navigate(`/locales/visualizar/${id}/editar`, { state: { local: localData } });
  };

  const handleCloseWarning = () => setWarningOpen(false);

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

  if (!localData) {
    return (
      <div className="text-center text-black text-xl">Local desconocido</div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-2">Detalle del Local</h1>
            <DateBadge />
          </div>

          {/* Tarjeta de información */}
          <div className="bg-white rounded-2xl shadow-md px-10 p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-black">{localData.name}</h2>
              <ButtonGeneric
                onClick={() => handleEdit(localData)}
                loading={formState.isLoading}
                disabled={formState.isLoading}
                className="w-full sm:w-auto"
                variant="default">
                <Edit size={18} /> Editar
              </ButtonGeneric>
            </div>

            {/* Información detallada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-16 mb-6 text-black text-sm">
              <div>
                <p className="font-semibold mb-1">Nombre</p>
                <p>{localData.name}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Capacidad</p>
                <p>{localData.capacity}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Estado</p>
                <EventStatusBadge status={localData.status} />
              </div>

              <div>
                <p className="font-semibold mb-1">Ciudad</p>
                <p>{localData.city}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Distrito</p>
                <p>{localData.district}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Dirección</p>
                <p>{localData.address}</p>
              </div>

              <div>
                <p className="font-semibold mb-2">Correo de contacto</p>
                <p>{localData.contactEmail || "—"}</p>
              </div>   
            </div>
          </div>  
        </div>  
      </div>

      <ModalWarning
        isOpen={warningOpen}
        onClose={handleCloseWarning}
        onConfirm={handleConfirmEdit}/>
    </div>
  );
}

export default LocalDetailPage;
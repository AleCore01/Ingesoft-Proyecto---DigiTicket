import { Eye, Trash2, ChevronDown, XCircle, CircleAlert } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { localService } from "../../services/localService";
import { usePageSlice } from "../../hooks/usePageSlice";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import StatusPillFilter from "../../components/Badges/StatusPillFilter";
import ModalWarning from "../../components/Modal/ModalWarning";
import DateBadge from "../../components/Badges/DateBadge";
import EventStatusBadge from "../../components/Badges/EventStatusBadge";
import SearchBar from "../../components/Layout/SearchBar";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import ModalCheck from "../../components/Modal/ModalCheck";
import ContentPreLoader from "../../components/Layout/ContentPreloader";
import Pagination from "../../components/Pagination/Pagination";

function LocalListPage() {
  const navigate = useNavigate();

  const [locales, setLocales] = useState([]);
  const [localesRaw, setLocalesRaw] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("activo");
  
  const [loading, setLoading] = useState(true);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [selectedLocal, setSelectedLocal] = useState(null);

  const [warningOpen, setWarningOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districtOptions, setDistrictOptions] = useState([]);
  const fetchedOnce = useRef(false);

  const { page, setPage, totalPages, pageItems } = usePageSlice(locales, 5);

  const toApiStatus = (ui) => {
    const v = (ui || "").toLowerCase();
    if (v === "activo") return "ACTIVE";
    if (v === "inactivo") return "INACTIVE";
    return undefined; // Todos
  };

  // --- Cargar desde backend --- 
  const loadFromBackend = async () => {
    try {
      setLoading(true);
      const resp = await localService.getAll();
      const list = Array.isArray(resp?.data) ? resp.data : resp || [];
      setLocalesRaw(Array.isArray(list) ? list : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error("Error cargando locales:", error);
      setLocalesRaw([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Filtros locales (estado, búsqueda, distrito)
  const applyFilters = (list, search, uiStatus, district) => {
    const apiStatus = toApiStatus(uiStatus);
    let filtered = Array.isArray(list) ? [...list] : [];

    if (apiStatus) {
      filtered = filtered.filter((loc) => loc.status === apiStatus);
    }

    if (district) {
      filtered = filtered.filter((loc) => (loc.district || "") === district);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((loc) =>
        ((loc.name || "") + " " + (loc.city || "") + " " + (loc.district || ""))
          .toLowerCase()
          .includes(s)
      );
    }

    return filtered;
  };

  // Carga inicial
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    (async () => {
      const list = await loadFromBackend();
      const filtered = applyFilters(list, "", selectedStatus, selectedDistrict);
      setLocales(filtered);
      setInitialLoaded(true);
    })();
  }, []);

  // Refrescar locales desde backend y aplicar filtros actuales
  const fetchLocales = async () => {
    const list = await loadFromBackend();
    const filtered = applyFilters(list, searchTerm, selectedStatus, selectedDistrict);
    setLocales(filtered);
  };

  // Cargar distritos
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setDistrictLoading(true);
        const res = await localService.district.getAll();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.districts)
          ? res.districts
          : [];
        setDistrictOptions(list);
      } catch (error) {
        console.error("Error cargando distritos:", error);
        setDistrictOptions([]);
      } finally {
        setDistrictLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  // Cuando cambian filtros (estado, distrito)
  useEffect(() => {
    if (!initialLoaded) return;

    setLocales(
      applyFilters(localesRaw, searchTerm, selectedStatus, selectedDistrict)
    );
    setPage(1);
  }, [selectedStatus, selectedDistrict]);

  // Cuando cambia búsqueda
  useEffect(() => {
    if (!initialLoaded) return;

    setLocales(
      applyFilters(localesRaw, searchTerm, selectedStatus, selectedDistrict)
    );
    setPage(1);
  }, [searchTerm]);

  // --- Limpiar filtros ---
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDistrict('')
    setSelectedStatus("activo");
    setPage(1)
  };

  const handleCreateClick = () => {
    navigate("/locales/crear");
  };

  const handleViewClick = (id) => {
    navigate(`/locales/visualizar/${id}`);
  };

  const handleDeleteClick = (id) => {
    setSelectedLocal(id);
    setWarningOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLocal) {
      setWarningOpen(false);
      return;
    }
      
    try {
      // 1) Verificar cuántos eventos tiene el local
      const respCount = await localService.countEvents(selectedLocal);
      const eventCount = Number(respCount?.data ?? respCount ?? 0);

      if (eventCount > 0) {
        // Tiene eventos → no se puede eliminar
        setWarningOpen(false);
        setSelectedLocal(null);

        setErrorModalOpen(true);
        setTimeout(() => {
          setErrorModalOpen(false);
        }, 5000); 

        return;
      }

      // 2) Si NO tiene eventos → desactivar/eliminar
      const resp = await localService.getById(selectedLocal);
      const currentLocal = resp?.data ?? resp;

      const updatedLocal = {
        ...currentLocal,
        status: "INACTIVE",
      };

      await localService.update(selectedLocal, updatedLocal);
      await fetchLocales();
      setPage(1);

      setSuccessModalOpen(true);
      setTimeout(() => {
        setSuccessModalOpen(false);
      }, 2000);

    } catch (error) {
      console.error("Error eliminando el local:", error);
    } finally {
      setWarningOpen(false);
      setSelectedLocal(null);
    }
  };

  const handleCloseWarning = () => {
    setWarningOpen(false);
    setSelectedLocal(null);
  };

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden pt-16 md:pt-0">
        <div className="hidden md:block">
          <TopBar />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="px-2 text-2xl md:text-3xl font-bold text-black">Locales</h1>
            <DateBadge />
          </div>

          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 bg-white rounded-2xl shadow-md p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full lg:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
               
              <StatusPillFilter
                statusOptions={["activo", "inactivo"]}
                selectedStatus={selectedStatus}
                onChange={setSelectedStatus}
                defaultStatus="activo"
                includeAll={false}/>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-44">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="border border-gray-300 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple text-sm appearance-none [-webkit-appearance:none]"
                  >
                    <option value="">Distrito</option>
                    {districtOptions.map((dist) => (
                      <option key={dist.id} value={dist.name}>
                        {dist.name}
                      </option>
                    ))}
                </select>

                  {/* Icono ChevronUp */}
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black"
                  />
                </div>  
                <button
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-purple transition-colors"
                  title="Limpiar filtros"
                >
                  <XCircle size={20} />
                </button>
              </div>         
            </div> 
            
            <ButtonGeneric
              onClick={handleCreateClick}
              className="w-full sm:w-auto"
              variant="default">
              + Registrar
            </ButtonGeneric>
          </div>
          
          {/* contenido */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            {loading || districtLoading || !initialLoaded ? (
              <ContentPreLoader loading={true} text="Cargando locales" />
            ) : (
              <TableContainer className="rounded-xl shadow-sm border table-container">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead className="MuiTableHead-root bg-gray-100">
                    <TableRow>
                      <TableCell align="left" sx={{ paddingLeft: 5 }}>Nombre</TableCell>
                      <TableCell align="left">Ciudad</TableCell>
                      <TableCell align="left">Distrito</TableCell>
                      <TableCell align="center">Capacidad</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow> 
                  </TableHead>

                  <TableBody>
                    {pageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center"> No se encontraron locales registrados.</TableCell>
                      </TableRow>
                    ) : (
                      pageItems.map((local) => (
                        <TableRow key={local.id} sx={{ '& td:first-of-type': { pl: 5 } }}>
                          <TableCell align="left">{local.name}</TableCell>
                          <TableCell align="left">{local.city}</TableCell>
                          <TableCell align="left">{local.district}</TableCell>
                          <TableCell align="center">{local.capacity}</TableCell>
                          <TableCell align="center"> <EventStatusBadge status={local.status} /> </TableCell>
                          <TableCell align="center">
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => handleViewClick(local.id)}
                                title="Visualizar"
                                className="rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100">
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(local.id)}
                                title="Eliminar"
                                className=" rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}  
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}/>
          </div>
        </div>
      </div>

      <ModalWarning
        isOpen={warningOpen}
        onClose={handleCloseWarning}
        onConfirm={handleConfirmDelete}/>

      <ModalCheck
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Local eliminado exitosamente"/>

      <ModalCheck
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message="No se pudo eliminar el local porque tiene eventos programados."
        icon={() => (
          <div className="w-14 h-14 rounded-full bg-fuchsia-100 flex items-center justify-center mb-3 mx-auto">
            <CircleAlert className="w-8 h-8 text-purple" />
          </div>
        )}
      />  
    </div>
  );
}

export default LocalListPage;
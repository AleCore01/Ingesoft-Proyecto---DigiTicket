import { Mail, CircleAlert } from 'lucide-react'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { usePageSlice } from '../../hooks/usePageSlice'
import { userClientService, POINTS_STATUS_ENUM } from "../../services/userClientService";
import { loyaltyNotificationService } from "../../services/loyaltyNotificationService";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import DateBadge from '../../components/Badges/DateBadge'
import SearchBar from '../../components/Layout/SearchBar'
import StatusPillFilter from '../../components/Badges/StatusPillFilter'
import ButtonGeneric from '../../components/Buttons/ButtonGeneric'
import ContentPreLoader from '../../components/Layout/ContentPreloader'
import Pagination from '../../components/Pagination/Pagination'
import ModalCheck from "../../components/Modal/ModalCheck";

const UsersListPage = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([]);
  const [clientsRaw, setClientsRaw] = useState([]);

  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPointsStatus, setSelectedPointsStatus] = useState("");
  const fetchedOnce = useRef(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [noClientsToNotify, setNoClientsToNotify] = useState(false);

  const { page, setPage, totalPages, pageItems } = usePageSlice(clients, 5);

  // --- helper: formatear fecha ---
  const formatDate = (value) => {
    if (!value) return 'No registrado';

    const d = new Date(value);
    if (isNaN(d)) return '-';

    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // --- helper: normalizar etiqueta de estado ---
  const normalizeStatusLabel = (label) => {
    if (!label || label === 'todos') return 'todos';
    return label;
  };

  // --- helper: filtrar por búsqueda ---
  const applySearchFilter = (list, search) => {
    if (!search) return list ?? [];

    const s = search.toLowerCase();
    return (list ?? []).filter((c) =>
      `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s)
    );
  };

  // --- helper: obtener clientes según estado ---
  const fetchClientsByState = useCallback(async (statusLabel, name) => {
    const normalized = normalizeStatusLabel(statusLabel);
    const trimmedName = name?.trim() || undefined;

    try {
      let response;

      if (normalized === 'por vencer') {
        response = await userClientService.getClientsWithPointsExpiringIn5Days();
        let list = Array.isArray(response?.data) ? response.data : response ?? [];
        list = Array.isArray(list) ? list : [];

        if (trimmedName) {
          const lower = trimmedName.toLowerCase();
          list = list.filter((c) =>
            `${c.firstName ?? ''} ${c.lastName ?? ''}`
              .toLowerCase()
              .includes(lower),
          );
        }

        return list;
      }

      if (normalized === 'todos') {
        response = await userClientService.getActiveClients(trimmedName);
      } else {
        const statusEnum = POINTS_STATUS_ENUM[normalized];
        response = await userClientService.getClientsByPointsStatus(
          statusEnum,
          trimmedName,
        );
      }

      const raw = Array.isArray(response?.data) ? response.data : response ?? [];
      return Array.isArray(raw) ? raw : [];
    } catch (error) {
      console.error('Error cargando clientes por estado:', error);
      return [];
    }
  }, []);

  // --- Cargar desde backend ---
  const loadFromBackend = async () => {
    try {
      setLoading(true);
      const resp = await userClientService.getActiveClients();
      const list = Array.isArray(resp?.data) ? resp.data : resp || [];
      setClientsRaw(Array.isArray(list) ? list : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error("Error cargando los usuarios:", error);
      setClientsRaw([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    (async () => {
      const list = await loadFromBackend();
      const filtered = applySearchFilter(list, searchTerm);
      setClients(filtered);
      setInitialLoaded(true);
    })();
  }, []);

  // --- Cuando cambia el estado de puntos -> llamar al backend ---
  const handleStatusChange = async (status) => {
    setSelectedPointsStatus(status);
    setPage(1);

    setLoading(true);
    try {
      const list = await fetchClientsByState(status);
      setClientsRaw(list);
      setClients(applySearchFilter(list, searchTerm));
    } catch (error) {
      console.error("Error al cambiar estado de puntos:", error);
      setClientsRaw([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambian filtros (nombre, estado)
  useEffect(() => {
    if (!initialLoaded) return;
    setClients(applySearchFilter(clientsRaw, searchTerm));
    setPage(1);
  }, [searchTerm, clientsRaw]);

  const handleSendMassiveEmail = async () => {
    try {
      setSendingEmail(true);

      const response = await loyaltyNotificationService.triggerExpiryNotifications();
      const data = response?.data ?? {};

      const created7 = Number(data.createdNotifications7Days ?? 0);
      const created1 = Number(data.createdNotifications1Day ?? 0);

      const total =
      typeof data.totalNotifications === "number"
        ? data.totalNotifications
        : created7 + created1;

      let msg = "";  
        
      if (total === 0) { // NO se envió ningún correo
        setNoClientsToNotify(true);
        msg = 
          "No hay notificaciones para enviar.\n" +
          "No existen clientes con puntos por vencer.";  
      } else { // Caso: sí se enviaron correos
        setNoClientsToNotify(false);
        msg =
          (data.message ?? "Correos enviados correctamente.\n") +
          "\nNotificaciones 7 días: " + created7 +
          "\nNotificaciones 1 día: " + created1 +
          "\n\nTotal de notificaciones: " + total +
          "\n--------------------------------";
      }

      setSuccessMessage(msg);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error al enviar correos masivos:", error);
      window.alert("Ocurrió un error al ejecutar el proceso de notificación.");
    } finally {
      setSendingEmail(false);
    }
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
            <h1 className="px-2 text-2xl md:text-3xl font-bold text-black"> Usuarios </h1>
            <DateBadge />
          </div>

          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 bg-white rounded-2xl shadow-md p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full lg:w-auto">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />

              <StatusPillFilter
                statusOptions={["vigentes", "por vencer", "expirados"]}
                selectedStatus={selectedPointsStatus}
                onChange={handleStatusChange}
                includeAll={true}
              />
            </div>
            <ButtonGeneric
              onClick={handleSendMassiveEmail}
              className="w-full sm:w-auto"
              variant="default"
              disabled={sendingEmail}
            >
              <Mail size={16} />
              {sendingEmail ? "Enviando..." : "Enviar correo"}
            </ButtonGeneric>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            {loading  ? (
              <ContentPreLoader loading={loading} text="Cargando usuarios" />
            ) : (
              <TableContainer className="rounded-xl shadow-sm border table-container">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell align="left" sx={{ paddingLeft: 5 }}>Nombres</TableCell>
                      <TableCell align="left">Correo</TableCell>
                      <TableCell align="left">Puntos acum.</TableCell>
                      <TableCell align="center">Fecha de expiración</TableCell>
                    </TableRow> 
                  </TableHead>

                  <TableBody>
                    {pageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center"> No se encontraron usuarios registrados.</TableCell>
                      </TableRow>
                    ) : (
                      pageItems.map((client) => (
                        <TableRow key={client.id} sx={{ '& td:first-of-type': { pl: 5 } }}>
                          <TableCell align="left">{`${client.lastName ?? ""}, ${client.firstName ?? ""}`}</TableCell>
                          <TableCell align="left">{client.email}</TableCell>
                          <TableCell align="center">{client.loyaltyPoints ?? 0}</TableCell>
                          <TableCell align="center">{formatDate(client.pointsExpiryDate)}</TableCell>
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
      <ModalCheck
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoCloseMs={5000}
        icon={
          noClientsToNotify
            ? () => (
                <div className="w-14 h-14 rounded-full bg-fuchsia-100 flex items-center justify-center mb-3 mx-auto">
                  <CircleAlert className="w-8 h-8 text-purple" />
                </div>
              )
            : undefined
        }
      />
    </div>
  )
};

export default UsersListPage;
import { PenTool, Trash2 } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { usePageSlice } from "../../hooks/usePageSlice";

import SideBarMenu from "../../components/Layout/SideBarMenu";
import TopBar from "../../components/Layout/TopBar";
import SearchBar from "../../components/Layout/SearchBar";
import StatusPillFilter from "../../components/Badges/StatusPillFilter";
import DateBadge from "../../components/Badges/DateBadge";
import EventStatusBadge from "../../components/Badges/EventStatusBadge";
import ButtonGeneric from "../../components/Buttons/ButtonGeneric";
import ContentPreLoader from "../../components/Layout/ContentPreloader";
import Pagination from "../../components/Pagination/Pagination";
import ModalWarning from "../../components/Modal/ModalWarning";
import ModalCheck from "../../components/Modal/ModalCheck";

import { adminService } from "../../services/adminService";
import { auditLogService } from "../../services/auditLogService";

function AdminsListPage() {
  const navigate = useNavigate();

  const [adminsRaw, setAdminsRaw] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("activo");

  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchedOnce = useRef(false);
  const { page, setPage, totalPages, pageItems } = usePageSlice(admins, 5);

  // -------------------------------
  // Mapea UI → API
  // -------------------------------
  const toApiStatus = (ui) => {
    const v = ui?.toLowerCase();
    if (v === "activo") return "ACTIVE";
    if (v === "bloqueado") return "BLOCKED";
    if (v === "eliminado") return "DELETED";
    return null;
  };

  // -----------------------------------------
  // Formato de fechas
  // -----------------------------------------
  const getDateString = (value) => {
    if (!value) return "—";

    const [datePart] = String(value).split(/[ T]/);
    if (!datePart) return "—";

    const [y, m, d] = datePart.split("-");
    if (!y || !m || !d) return "—";

    return `${d}-${m}-${y}`;
  };

  // ------------------------------------------------------------
  // 🔵 Obtener admins + último inicio de sesión (createdAt)
  // ------------------------------------------------------------
  const fetchAdminsWithAudit = async () => {
    try {
      setLoading(true);

      const res = await adminService.getAll();
      const list = res?.data || res || [];

      const listWithAudit = await Promise.all(
        list.map(async (admin) => {
          try {
            const logRes = await auditLogService.getLastLogByUser(admin.id);
            
            //console.log("🔵 Último log recibido para admin", admin.id, logRes.createdAt);
            let lastLogin = "—";

            // Fix: backend devuelve createdAt (camelCase)
            const created = logRes?.createdAt || logRes?.created_at;
            if (created) {
              lastLogin = getDateString(created);
            }

            return { ...admin, lastLogin };
          } catch (e) {
            console.error("Error obteniendo último log:", e);
            return { ...admin, lastLogin: "—" };
          }
        })
      );

      setAdminsRaw(listWithAudit);
      return listWithAudit;

    } catch (err) {
      console.error("Error cargando admins:", err);
      setAdminsRaw([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Filtros
  // ------------------------------------------------------------
  const applyFilters = (list, search, uiStatus) => {
    const apiStatus = toApiStatus(uiStatus);
    let filtered = [...list];

    if (apiStatus) {
      filtered = filtered.filter((a) => a.status === apiStatus);
    }

    if (search) {
      filtered = filtered.filter((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  // ------------------------------------------------------------
  // Carga inicial
  // ------------------------------------------------------------
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    (async () => {
      const list = await fetchAdminsWithAudit();
      const filtered = applyFilters(list, "", selectedStatus);
      setAdmins(filtered);
      setInitialLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    setAdmins(applyFilters(adminsRaw, searchTerm, selectedStatus));
    setPage(1);
  }, [selectedStatus, searchTerm]);

  // ------------------------------------------------------------
  // DELETE ADMIN
  // ------------------------------------------------------------
  const [warningOpen, setWarningOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const handleDeleteClick = (id) => {
    setSelectedAdmin(id);
    setWarningOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.delete(selectedAdmin);

      const updatedRaw = adminsRaw.map((a) =>
        a.id === selectedAdmin ? { ...a, status: "DELETED" } : a
      );

      setAdminsRaw(updatedRaw);
      setAdmins(applyFilters(updatedRaw, searchTerm, selectedStatus));

      setWarningOpen(false);
      setSuccessModalOpen(true);

      setTimeout(() => setSuccessModalOpen(false), 2000);

    } catch (error) {
      console.error("❌ Error eliminando admin:", error);
      setWarningOpen(false);
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <div className="hidden md:block">
          <TopBar />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="px-2 text-2xl md:text-3xl font-bold text-black">
              Administradores
            </h1>
            <DateBadge />
          </div>

          {/* filtros */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 bg-white rounded-2xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

              <StatusPillFilter
                statusOptions={["activo", "bloqueado", "eliminado"]}
                selectedStatus={selectedStatus}
                onChange={setSelectedStatus}
                defaultStatus="activo"
                includeAll={false}
              />
            </div>

            <ButtonGeneric
              onClick={() => navigate("/administradores/crear")}
              className="w-full sm:w-auto"
            >
              + Registrar
            </ButtonGeneric>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            {!initialLoaded ? (
              <ContentPreLoader loading text="Cargando administradores..." />
            ) : admins.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No se encontraron administradores.
              </div>
            ) : (
              <TableContainer className="rounded-xl shadow-sm border table-container">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell align="center">Nombre</TableCell>
                      <TableCell align="center">Correo</TableCell>
                      <TableCell align="center">Último inicio sesión</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pageItems.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell align="center">{admin.firstName}</TableCell>
                        <TableCell align="center">{admin.email}</TableCell>

                        <TableCell align="center">
                          {getDateString(admin.lastLogin)}
                        </TableCell>

                        <TableCell align="center">
                          <EventStatusBadge status={admin.status} />
                        </TableCell>

                        <TableCell align="center">
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => navigate(`/administradores/editar/${admin.id}`)}
                              className="rounded-lg p-2 hover:scale-110 hover:bg-gray-100 transition"
                            >
                              <PenTool size={18} />
                            </button>

                            <button
                              onClick={() => handleDeleteClick(admin.id)}
                              className="rounded-lg p-2 hover:scale-110 hover:bg-gray-100 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalWarning
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <ModalCheck
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Administrador eliminado correctamente"
      />
    </div>
  );
}

export default AdminsListPage;

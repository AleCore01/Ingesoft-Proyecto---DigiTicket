import React, { useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import ContentPreLoader from "./Layout/ContentPreloader";
import ModalWarning from "./Modal/ModalWarning";
import ModalCheck from "./Modal/ModalCheck";

const formatSoles = (v) =>
  v == null || v === "" ? "—"
  : new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN"}).format(Number(v));



export default function TicketPricesTable({
  rows = [],
  loading = false,
  error = null,
  readOnly = false,
  toggleEditZone,
  updateZoneField,
  removeZone,
  renderActions,
  onMutated,
}) {
  const items = Array.isArray(rows)
    ? rows
    : Array.isArray(rows?.data)
      ? rows.data
      : Array.isArray(rows?.items)
        ? rows.items
        : (rows && typeof rows === "object")
          ? Object.values(rows)
          : [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  //const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmIndex, setConfirmIndex] = useState(null); 
  const [deleting, setDeleting] = useState(false);   
  const [checkOpen, setCheckOpen] = useState(false);    
    
  const inputSm =
    "h-9 px-3 border rounded-full bg-white focus:bg-gray-100 " +
    "focus:outline-none focus:ring-1 focus:ring-gray-100 focus:border-gray-200";

  if (error) return <div className="p-4 text-sm text-red-600">No se pudo cargar las zonas y precios.</div>;

  const handleAskDelete = (index) => {
    setConfirmIndex(index);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmIndex == null) return;
    setDeleting(true);
    try {
      await removeZone?.(confirmIndex);
      onMutated?.(); 
      setCheckOpen(true); 
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmIndex(null);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setConfirmIndex(null);
    //setConfirmTarget(null);
  };

  return (
    <div>
      {loading ? (
        <ContentPreLoader loading={loading} text="Cargando zonas y precios" />
      ) : (
        <TableContainer className="rounded-xl shadow-sm border table-container mt-3">
          <Table sx={{ minWidth: 650}}>
            <TableHead className="MuiTableHead-root bg-gray-100">
              <TableRow>
                <TableCell align="center">Zonas</TableCell>
                <TableCell align="center">Precio</TableCell>
                <TableCell align="center">Capacidad</TableCell>
                {!readOnly && (<TableCell align="center">Acciones</TableCell>)}
              </TableRow>
            </TableHead>

            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"> Aún no hay zonas definidas. Usa “Agregar".</TableCell>
                </TableRow>
              ) : (
                items.map((zone, i) => (
                  <TableRow key={zone.id ?? `row-${i}`}>
                    {/* Zona */}
                    <TableCell align="center">
                      {readOnly || !zone.editing ? (
                        <span className="text-black">{zone.displayName || "—"}</span>
                      ) : (
                        <input
                          className={`${inputSm} w-52`}
                          placeholder="Zona"
                          value={zone.displayName}
                          onChange={(e) => updateZoneField?.(i, "displayName", e.target.value)}
                        />
                      )}
                    </TableCell>

                    {/* Precio */}
                    <TableCell align="center">
                      {readOnly || !zone.editing ? (
                        <span className="text-black">{formatSoles(zone.price)}</span>
                      ) : (
                        <div className="inline-flex items-center">
                          <span className="mr-1 text-gray">S/.</span>
                          <input
                          className={`${inputSm} w-28 text-center`}
                          inputMode="decimal"
                          placeholder="0"
                          value={zone.price}
                          onChange={(e) => updateZoneField?.(i, "price", e.target.value)}
                          />
                        </div>
                      )}
                    </TableCell>

                    {/* Capacidad */}
                    <TableCell align="center">
                      {readOnly || !zone.editing ? (
                        <span className="text-black">{zone.seatsQuota ?? 0}</span>
                      ) : (
                        <input
                          className={`${inputSm} w-24 text-center`}
                          inputMode="numeric"
                          placeholder="0"
                          value={zone.seatsQuota}
                          onChange={(e) => updateZoneField?.(i, "seatsQuota", e.target.value)}
                        />
                      )}
                    </TableCell>

                    {/* Acciones */}
                    {!readOnly && (
                      <TableCell align="center">
                        {renderActions ? (
                            renderActions(zone, i, { toggleEditZone, removeZone, updateZoneField })
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => toggleEditZone?.(i)}
                                title="Editar"
                                className="rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100"
                                disabled={deleting}
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAskDelete(i)}
                                title="Eliminar"
                                className="rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100"
                                disabled={deleting}
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ModalWarning 
        isOpen={confirmOpen} 
        onClose={handleCancelDelete}
        onConfirm={deleting ? undefined : handleConfirmDelete} />

      <ModalCheck 
        isOpen={checkOpen} 
        message="Se eliminó la zona correctamente" 
        onClose={() => setCheckOpen(false)} />  
    </div>
  );
}
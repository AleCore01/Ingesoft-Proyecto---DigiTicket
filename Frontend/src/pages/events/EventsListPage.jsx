import { Eye, Trash2, XCircle, ChevronDown } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { eventsService } from '../../services/eventsService'
import { useEventCategories } from '../../hooks/useEventCategories'
import { useEventLocation } from '../../hooks/useEventLocation'
import { usePageSlice } from '../../hooks/usePageSlice'
import { useNavigate } from 'react-router-dom'
import { localService } from '../../services/localService'

import TopBar from '../../components/Layout/TopBar'
import DateBadge from '../../components/Badges/DateBadge'
import SearchBar from '../../components/Layout/SearchBar'
import SideBarMenu from '../../components/Layout/SideBarMenu'
import EventStatusBadge from '../../components/Badges/EventStatusBadge'
import ButtonGeneric from '../../components/Buttons/ButtonGeneric'
import ModalWarning from '../../components/Modal/ModalWarning'
import ContentPreLoader from '../../components/Layout/ContentPreloader'
import Pagination from '../../components/Pagination/Pagination'
import ModalCheck from '../../components/Modal/ModalCheck'

const EventsListPage = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [eventsRaw, setEventsRaw] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const [loading, setLoading] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const [warningOpen, setWarningOpen] = useState(false) 
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [locationOptions, setLocationOptions] = useState([])

  const { getLocationName } = useEventLocation()
  const { getCategoryName } = useEventCategories()
  const fetchedOnce = useRef(false);  

  const { page, setPage, pageItems, totalPages } = usePageSlice(events, 5)

  const toApiStatus = (ui) => {
    const v = (ui || '').toLowerCase()
    if (v === 'borrador') return 'DRAFT'
    if (v === 'publicado') return 'PUBLISHED'
    if (v === 'cancelado') return 'CANCELED'
    if (v === 'finalizado') return 'FINISHED'
    return undefined // Todos
  }

  /* obtener lista base del backend */
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const resp = await eventsService.getAll()
      const list = Array.isArray(resp?.data) ? resp.data : (resp ?? [])
      const safeList = Array.isArray(list) ? list : []

      setEventsRaw(safeList)  
      setEvents(safeList)      
    } catch (error) {
      console.error('Error cargando eventos:', error)
      setEventsRaw([])
      setEvents([])
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }

  // Carga inicial
  useEffect(() => {
    if (fetchedOnce.current) return;                     
    fetchedOnce.current = true;
    fetchEvents()
  }, []);


  // cargar todos los locales activos para el filtro
  useEffect(() => {
    let cancelled = false

    const fetchActiveLocales = async () => {
      try {
        const resp = await localService.searchByStatus("ACTIVE")
        const list = Array.isArray(resp?.data) ? resp.data : (resp ?? [])

        if (!cancelled) {
          setLocationOptions(list)
        }
      } catch (error) {
        console.error("Error cargando locales activos:", error)
      }
    }

    fetchActiveLocales()

    return () => {
      cancelled = true
    }
  }, [])

  // Filtros locales (búsqueda, estado, local)
  const applyFilters = (list, search, uiStatus, locationId) => {
    let filtered = Array.isArray(list) ? [...list] : [];

    // 1) Estado (UI → API)
    const apiStatus = toApiStatus(uiStatus);
    if (apiStatus) {
      filtered = filtered.filter((ev) => ev.status === apiStatus);
    }

    // 2) Local (locationId o ev.location.id)
    if (locationId) {
      const locIdStr = String(locationId);
      filtered = filtered.filter((ev) => {
        const evLocId = ev.locationId ?? ev.location?.id;
        return String(evLocId ?? "") === locIdStr;
      });
    }

    // 3) Búsqueda (título + local + categoría)
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((ev) =>
        (
          (ev.title || "") +
          " " +
          (getLocationName(ev) || "") +
          " " +
          (getCategoryName(ev) || "")
        )
          .toLowerCase()
          .includes(s)
      );
    }

    return filtered;
  };

  // --- re-aplicar filtros cuando cambian search / estado / local ---
  useEffect(() => {
    if (!initialLoaded) return
    const filtered = applyFilters(
      eventsRaw,
      searchTerm,
      selectedStatus,
      selectedLocation
    )
    setEvents(filtered)
    setPage(1)
  }, [eventsRaw, searchTerm, selectedStatus, selectedLocation, initialLoaded, setPage])

  // --- Limpiar filtros ---
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedLocation('')
    setEvents(eventsRaw)
    setPage(1)
  };

  /* ---- Helpers ---- */
  const getDateString = (value) => {
    if (!value) return '—'
    const [datePart] = String(value).split(/[ T]/) // "2025-10-02"
    const [y, m, d] = datePart.split('-')
    return y && m && d ? `${d}-${m}-${y}` : '—'
  }

  /* ---- Actions ---- */
  /* Funcion para registrar un evento */
  const handleCreateClick = () => {
    navigate(`/eventos/crear`)
  }

  // Función para ver el detalle del evento
  const handleViewClick = (id) => {
    navigate(`/eventos/visualizar/${id}`)
  }

  /* Función para abrir el modal de advertencia */
  const handleDeleteClick = (eventId) => {
    setSelectedEvent(eventId)
    setWarningOpen(true)
  }

  // Función para confirmar la eliminación
  const handleConfirmDelete = async () => {
    if (selectedEvent) {
      try {
        await eventsService.delete(selectedEvent) // Llamada al backend
        await fetchEvents() /* Actualizar la lista de eventos */
        setPage(1)

        setSuccessModalOpen(true) // Mostrar modal de éxito

        // Ocultar automáticamente después de 2 segundos
        setTimeout(() => {
          setSuccessModalOpen(false)
        }, 2000)
      } catch (error) {
        console.error('Error al eliminar el evento:', error)
      }
    }
    setWarningOpen(false)
    setSelectedEvent(null)
  }

  // Función para cerrar el modal
  const handleCloseWarning = () => {
    setWarningOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden pt-16 md:pt-0">
        <div className="hidden md:block">
          <TopBar />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">  
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-3">
              Eventos
            </h1>
            <DateBadge />
          </div>

          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 bg-white rounded-2xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />

              {/* === FILTROS === */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-44">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {setSelectedStatus(e.target.value) }}
                    className="border border-gray-300 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple text-sm appearance-none [-webkit-appearance:none]"
                  >
                    <option value="">Estado</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Publicado">Publicado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black"
                  />
                </div>

                <div className="flex w-full sm:w-44 items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="border border-gray-300 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple text-sm appearance-none [-webkit-appearance:none]"
                    >
                      <option value="">Local</option>
                      {locationOptions.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
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
            </div>
            <ButtonGeneric
              onClick={handleCreateClick}
              className="w-full sm:w-auto"
              variant="default"
            >
              + Registrar
            </ButtonGeneric>
          </div>

          {/* Tabla de eventos */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            {loading ? (
              <ContentPreLoader loading={loading} text="Cargando eventos" />
            ) : (
              <TableContainer className="rounded-xl shadow-sm border table-container">
                <Table sx={{ minWidth: 650 }}>
                  <TableHead className="MuiTableHead-root bg-gray-100">
                    <TableRow>
                      <TableCell align="left" sx={{ paddingLeft: 10 }}>Nombre</TableCell>
                      <TableCell align="left">Categoría</TableCell>
                      <TableCell align="left">Fecha</TableCell>
                      <TableCell align="left">Local</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          {' '}
                          No se encontraron eventos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageItems.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell align="left" className="px-4">
                            <div className="flex items-center gap-3">
                              {event?.imageBase64 && (
                                <img
                                  src={`data:image/jpeg;base64,${event.imageBase64}`}
                                  alt={event.title}
                                  style={{
                                    width: 56,
                                    height: 40,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                  }}
                                />
                              )}
                              <span>{event.title}</span>
                            </div>
                          </TableCell>
                          <TableCell align="left"> {getCategoryName(event)} </TableCell>
                          <TableCell align="left"> {getDateString(event.startsAt)}</TableCell>
                          <TableCell align="left"> {getLocationName(event)}</TableCell>
                          <TableCell align="center">
                            {' '}
                            <EventStatusBadge status={event.status} />
                          </TableCell>
                          <TableCell align="center">
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => handleViewClick(event.id)}
                                title="Visualizar"
                                className="rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(event.id)}
                                title="Eliminar"
                                className="rounded-lg p-2 transition-all transform hover:scale-110 hover:bg-gray-100"
                              >
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
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Modal de advertencia */}
      <ModalWarning
        isOpen={warningOpen}
        onClose={handleCloseWarning}
        onConfirm={handleConfirmDelete}
      />

      <ModalCheck
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="Evento eliminado exitosamente"
      />
    </div>
  )
}

export default EventsListPage
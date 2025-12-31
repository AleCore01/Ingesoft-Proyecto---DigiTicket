import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { eventsService } from '../../services/eventsService'
import { useEventZones } from '../../hooks/useEventZones'
import { useEventCategories } from '../../hooks/useEventCategories'
import { useEventLocation } from '../../hooks/useEventLocation'

import SideBarMenu from '../../components/Layout/SideBarMenu'
import TopBar from '../../components/Layout/TopBar'
import DateBadge from '../../components/Badges/DateBadge'
import ButtonGeneric from '../../components/Buttons/ButtonGeneric'
import EventStatusBadge from '../../components/Badges/EventStatusBadge'
import ContentPreLoader from '../../components/Layout/ContentPreloader'
import ModalWarning from '../../components/Modal/ModalWarning'

const EventDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams() // obtener id del evento
  const [event, setEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [loading, setLoading] = useState(true)
  const [warningOpen, setWarningOpen] = useState(false)

  const {
    zones,
    totals,
    loading: zonesLoading,
    error: zonesError,
  } = useEventZones(event)
  const { getLocationName, getLocationAddress, getLocationCapacity } = useEventLocation()
  const { getCategoryName } = useEventCategories()

  const totalSold = Number(totals?.totalSold ?? 0) // totales

  const [formState, setFormState] = useState({ isLoading: false })

  // Cargar datos del evento -----------------
  useEffect(() => {
    let mounted = true

    const fetchEvent = async () => {
      try {
        setLoading(true)
        const data = await eventsService.getById(id)

        if (!mounted) return
        setEvent(data)
      } catch (error) {
        console.error('Error cargando detalle del evento:', error)
        navigate('/eventos')
      } finally {
        mounted && setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    } else {
      navigate('/eventos')
    }

    return () => {
      mounted = false
    }
  }, [id])

  const handleEdit = (event) => {
    setSelectedEvent(event) // Guardar evento a editar
    setWarningOpen(true)
  }

  const handleConfirmEdit = () => {
    if (selectedEvent) {
      setWarningOpen(false)
      const id = selectedEvent.id
      setSelectedEvent(null)
      navigate(`/eventos/visualizar/${id}/editar`, { state: { event: event } })
    }
  }

  const handleCloseWarning = () => {
    setWarningOpen(false)
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <SideBarMenu />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-8 bg-backgroundGeneral flex items-center justify-center">
            <ContentPreLoader
              loading={loading}
              text="Cargando detalle del evento..."
            />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center text-black text-xl">
        No se encontró el evento.
      </div>
    )
  }

  /* ---- Helpers ---- */
  const getHourRange = (
    startStr,
    durationMin = 0,
    { ceilEnd = false } = {}
  ) => {
    if (!startStr) return '— - —'
    const d = new Date(startStr)
    if (isNaN(d)) return '— - —'

    const startMin = d.getHours() * 60 + d.getMinutes()
    const endMin = (startMin + (Number(durationMin) || 0) + 1440) % 1440

    const toHH00 = (mins, ceil = false) => {
      let h = Math.floor(mins / 60)
      if (ceil && mins % 60 !== 0) h = (h + 1) % 24
      return `${String(h).padStart(2, '0')}:00`
    }

    return `${toHH00(startMin)} - ${toHH00(endMin, ceilEnd)}`
  }

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <SideBarMenu />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <TopBar />

        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-black px-3">
              {' '}
              Detalle del evento
            </h1>
            <DateBadge />
          </div>

          {/* Imagen (hero) del evento */}
          {event?.imageBase64 && (
            <div className="mb-6">
              <img
                src={`data:image/jpeg;base64,${event.imageBase64}`}
                alt={event.title}
                className="w-full max-h-[360px] object-cover rounded-2xl"
              />
            </div>
          )}
          {/* Tarjeta de información */}
          <div className="bg-white rounded-2xl shadow-md px-10 p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-black">{event.title}</h2>
              <ButtonGeneric
                onClick={() => handleEdit(event)}
                loading={formState.isLoading}
                disabled={formState.isLoading}
                className="w-full sm:w-auto"
                variant="default"
              >
                <Edit size={18} /> Editar
              </ButtonGeneric>
            </div>

            {/* Información del evento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-16 mb-6 text-black text-sm">
              <div>
                <p className="font-semibold mb-1">Fecha</p>
                <p>
                  {new Date(event.startsAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">Local</p>
                <p>{getLocationName(event)}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Categoría</p>
                <p>{getCategoryName(event)}</p>
              </div>

              {/* Fila 2 */}
              <div>
                <p className="font-semibold mb-1">Horario</p>
                <p>{getHourRange(event.startsAt, event.durationMin)}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Capacidad</p>
                <p>{getLocationCapacity(event) ?? '—'}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Fecha inicio de venta</p>
                <p>
                  {new Date(event.salesStartAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Fila 3 */}
              <div>
                <p className="font-semibold mb-1">Duración</p>
                <p>{event.durationMin} minutos</p>
              </div>

              <div>
                <p className="font-semibold mb-1">Dirección</p>
                <p>{getLocationAddress(event)}</p>
              </div>

              <div>
                <p className="font-semibold mb-2">Estado</p>
                <EventStatusBadge status={event.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 mb-6 text-sm">
              <p className="font-semibold mb-1">Descripción</p>
              <p>{event.description}</p>
            </div>

            {/* PRECIOS (izq) + VENDIDAS (der) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Precios de las entradas (izquierda) */}
              <div className="rounded-xl shadow-sm border border-black p-6">
                <h3 className="text-md font-bold mb-4">
                  Precios de las entradas
                </h3>
                <TableContainer className="rounded-xl shadow-sm border table-container mt-3">
                  <Table sx={{ minWidth: 100 }}>
                    <TableHead className="MuiTableHead-root bg-gray-100">
                      <TableRow>
                        <TableCell align="center">Zonas</TableCell>
                        <TableCell align="center">Precio</TableCell>
                        <TableCell align="center">Capacidad</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {zonesLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <ContentPreLoader loading={zonesLoading} text="Cargando zonas y precios..." />
                          </TableCell>
                        </TableRow>
                      ) : zones && zones.length > 0 ? (
                        zones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell align="center">
                              {zone.displayName ?? '—'}
                            </TableCell>
                            <TableCell align="center">
                              {Number(zone.price ?? 0).toLocaleString('es-PE',{ style: 'currency', currency: 'PEN' })}
                            </TableCell>
                            <TableCell align="center">
                              {Number(zone.seatsQuota ?? 0).toLocaleString('es-PE')}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            Sin zonas o precios configurados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              {/* Cantidad de entradas vendidas (derecha) */}
              <div className="rounded-xl shadow-sm border border-black p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-md font-bold">
                    Cantidad de entradas vendidas
                  </h3>
                  <div className="text-right leading-none">
                    <span className="text-3xl font-extrabold text-foreground">
                      {Number(totalSold ?? 0).toLocaleString('es-PE')}
                    </span>
                    <span className="text-3xl font-extrabold text-muted-foreground">
                      {' '}
                      / {Number(getLocationCapacity(event) ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Lista por zona */}
                <div className="mt-4 space-y-1 text-sm">
                  {!zonesLoading && (zones || []).length === 0 && (
                    <p className="text-muted-foreground">
                      Aún no hay entradas vendidas.
                    </p>
                  )}

                  {!zonesLoading &&
                    (zones || []).map((z, i) => (
                      <div
                        key={z?.id ?? `${z?.displayName ?? 'zona'}-${i}`}
                         className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0"
                        >
                          <span className="font-medium text-base">
                            {z?.displayName ?? '—'}
                          </span>
                          <span className="font-bold text-lg px-3">
                            {Number(z?.seatsSold ?? 0).toLocaleString('es-PE')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalWarning
        isOpen={warningOpen}
        onClose={handleCloseWarning}
        onConfirm={handleConfirmEdit}
      />
    </div>
  )
}

export default EventDetailPage

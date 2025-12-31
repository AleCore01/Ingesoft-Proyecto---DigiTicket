// src/services/events.service.js
import { api } from './http'
import { EVENT_PREFIX, BULK_PREFIX } from '../constants/api'

function normalizeEventPayload(evt) {
  if (!evt) return evt
  const { imageBase64, ...rest } = evt
  if (imageBase64 == null || imageBase64 === '') return rest
  return { ...rest, imageBase64 }
}

export const eventsService = {
  create: async (evento) => {
    // Validar campos requeridos
    if (!evento) {
      throw new Error('Datos de evento requeridos')
    }
    if (!evento.title || evento.title.trim() === '') {
      throw new Error('El título del evento es requerido')
    }
    // El backend espera 'startsAt', no 'date'
    if (!evento.startsAt && !evento.date) {
      throw new Error('La fecha del evento es requerida')
    }
    if (!evento.eventCategoryId && !evento.categoryId) {
      throw new Error('La categoría del evento es requerida')
    }
    
    const payload = normalizeEventPayload(evento)
    return api.post(`${EVENT_PREFIX}/add`, payload)
  },

  getAll: () => api.get(`${EVENT_PREFIX}/all`),

  getById: (id) => api.get(`${EVENT_PREFIX}/${id}`),

  update: (id, evento) => {
    const payload = normalizeEventPayload(evento)
    return api.put(`${EVENT_PREFIX}/update/${id}`, payload)
  },

  delete: (id) => api.delete(`${EVENT_PREFIX}/delete/${id}`),

  search: ({ title, status, locationId, from, to } = {}) => {
    const asLocalIso = (d) =>
      typeof d === 'string' ? d : d?.toISOString?.().slice(0, 19)

    return api.get(`${EVENT_PREFIX}/search`, {
      params: {
        title,
        status,
        locationId,
        from: asLocalIso(from),
        to: asLocalIso(to),
      },
    })
  },

  publish: (id) => api.post(`${EVENT_PREFIX}/${id}/publish`),

  cancel: (id) => api.post(`${EVENT_PREFIX}/${id}/cancel`),

  finish: (id) => api.post(`${EVENT_PREFIX}/${id}/finish`),

  // Bulk import via CSV
  bulkImport: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`${BULK_PREFIX}/events`, fd);
  },

  // Get purchase limit for event
  getPurchaseLimit: (eventId, userId) => 
    api.get(`api/events/${eventId}/purchase-limit`, {
      params: { userId }
    }),
}

// src/services/events.service.js
import { api } from "./http";
import { EVENT_ZONE_PREFIX, BULK_PREFIX } from "../constants/api";

export const eventZoneService = {
  create: async (dto) => {
    const payload = {
      eventId: Number(dto.eventId),
      displayName: String(dto.displayName ?? '').trim(),
      price: Number(dto.price ?? 0),
      seatsQuota: Number(dto.seatsQuota ?? 0),
      seatsSold: Number(dto.seatsSold ?? 0),
      status: String(dto.status ?? 'ACTIVE').toUpperCase(),
    };
    return api.post(`${EVENT_ZONE_PREFIX}/add`, payload);
  },

  getAll: () =>
    api.get(`${EVENT_ZONE_PREFIX}/all`),

  getById: (id) => 
    api.get(`${EVENT_ZONE_PREFIX}/${id}`),

  update: (id, dto) => {
    const eventZone = {
      ...dto,
      locationZoneId:
        dto?.locationZoneId === "" || dto?.locationZoneId == null
          ? undefined
          : Number(dto.locationZoneId),
    };
    return api.put(`${EVENT_ZONE_PREFIX}/update/${id}`, eventZone);
  },

  delete: (id) =>
    api.delete(`${EVENT_ZONE_PREFIX}/delete/${id}`),

  listByEvent: (eventId, config = {}) =>
    api.get(`${EVENT_ZONE_PREFIX}/list/${Number(eventId)}`, config),

  available: (eventId, zoneId, config = {}) =>
    api.get(`${EVENT_ZONE_PREFIX}/available`, {
      params: { eventId: Number(eventId), zoneId: Number(zoneId) },
      ...config,
    }),

  // Bulk import zones from CSV
  bulkImport: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`${BULK_PREFIX}/event-zones`, fd);
  },
};
// src/services/locationZoneService.ts
import { api } from './http'
import { LOCATION_ZONE_PREFIX } from "../constants/api";


export const locationZoneService = {
  create: async (locationId, dto) => {
    const payload = {
      name: String(dto.name ?? "").trim(),
      capacity: Number(dto.capacity ?? 0),
      status: String(dto.status ?? "ACTIVE").toUpperCase(),
    };

    return api.post(`${LOCATION_ZONE_PREFIX}/add`, payload, {
      params: { locationId: Number(locationId) },
    });
  },

  getById: (id) =>
    api.get(`${LOCATION_ZONE_PREFIX}/${Number(id)}`),

  update: (id, dto) => {
    const payload = {
      name: String(dto.name ?? "").trim(),
      capacity: Number(dto.capacity ?? 0),
      status: String(dto.status ?? "ACTIVE").toUpperCase(),
    };

    return api.put(`${LOCATION_ZONE_PREFIX}/update/${Number(id)}`, payload);
  },

  delete: (id) =>
    api.delete(`${LOCATION_ZONE_PREFIX}/delete/${Number(id)}`),

  listByLocation: (locationId, config = {}) =>
    api.get(`${LOCATION_ZONE_PREFIX}/list/${Number(locationId)}`, config),
};
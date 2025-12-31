import { api } from "./http";
import { LOCAL_PREFIX, DISTRICT_PREFIX, CITY_PREFIX, BULK_PREFIX } from "../constants/api";

export const localService = {
  getAll: () => api.get(`${LOCAL_PREFIX}/all`),
  getById: (id) => api.get(`${LOCAL_PREFIX}/${id}`),
  create: (location) => {
    // Validar campos requeridos
    if (!location) {
      return Promise.reject(new Error('Datos de local requeridos'))
    }
    if (!location.name || location.name.trim() === '') {
      return Promise.reject(new Error('El nombre del local es requerido'))
    }
    if (!location.address || location.address.trim() === '') {
      return Promise.reject(new Error('La dirección es requerida'))
    }
    if (!location.cityId) {
      return Promise.reject(new Error('La ciudad es requerida'))
    }
    if (!location.districtId) {
      return Promise.reject(new Error('El distrito es requerido'))
    }
    
    return api.post(`${LOCAL_PREFIX}/add`, location)
  },
  update: (id, location) => api.put(`${LOCAL_PREFIX}/update/${id}`, location),
  delete: (id) => api.delete(`${LOCAL_PREFIX}/delete/${id}`),
  
  searchByName: (name) => api.get(`${LOCAL_PREFIX}/search/name`, { params: { name } }),
  searchByStatus: (status) => api.get(`${LOCAL_PREFIX}/search/status/${status}`),
  searchByDistrict: (district) => api.get(`${LOCAL_PREFIX}/search/district`, { params: { district } }),

  // contar eventos asociados a una localización
  countEvents: (id) => api.get(`${LOCAL_PREFIX}/${id}/event/count`),

  // --- Ubicación ---
  city: { 
    getAll: () => api.get(`${CITY_PREFIX}/all`) },
  district: {
    getAll: () => api.get(`${DISTRICT_PREFIX}`),
    getByCity: (cityId) => api.get(`${DISTRICT_PREFIX}`, { params: { cityId } })
  },
  
  // Bulk import via CSV
  bulkImport: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`${BULK_PREFIX}/locals`, fd);
  },
};

